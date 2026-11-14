import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const migrationName = '0006_card_images.sql';

type TestDatabase = Awaited<ReturnType<Miniflare['getD1Database']>>;

let runtime: Miniflare | undefined;

afterEach(async () => {
  await runtime?.dispose();
  runtime = undefined;
});

function migrationFiles(through = '0004'): string[] {
  return readdirSync(migrationsDir)
    .filter((file) => /^\d{4}_.*\.sql$/.test(file) && file.slice(0, 4) <= through)
    .sort();
}

async function applyMigrationFile(db: TestDatabase, file: string): Promise<void> {
  await db.prepare('DROP TABLE IF EXISTS card_images').run();
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

async function createDatabase(through = '0004'): Promise<TestDatabase> {
  runtime = new Miniflare(
    convertV4MiniflareOptions({
      compatibilityDate: '2026-11-07',
      modules: true,
      script: 'export default { fetch() { return new Response("ok"); } };',
      d1Databases: ['DB'],
      d1Persist: ':memory:',
    }),
  );

  const db = await runtime.getD1Database('DB');
  for (const file of migrationFiles(through)) {
    await applyMigrationFile(db, file);
  }

  // Apply migration 0006 after 0004 (which doesn't have the strict source_versions trigger)
  await applyMigrationFile(db, migrationName);

  return db;
}

async function countRows(db: TestDatabase, table: string): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>();
  return row?.count ?? 0;
}

async function insertSource(db: TestDatabase, id = 'src-1', kind = 'internal', name = 'Test Source'): Promise<void> {
  await db.prepare('INSERT INTO sources (id, kind, name) VALUES (?, ?, ?)').bind(id, kind, name).run();
}

async function insertCard(
  db: TestDatabase,
  id = 'card-1',
  name = 'Test Card',
  imageUrl?: string,
  sourceId?: string,
) {
  await db
    .prepare('INSERT INTO cards (id, name, image_url, source_id) VALUES (?, ?, ?, ?)')
    .bind(id, name, imageUrl ?? null, sourceId ?? 'src-1')
    .run();
}

async function insertImages(
  db: TestDatabase,
  cardId: string,
  urls: string[],
  sourceId: string,
  type = 'original',
) {
  for (let i = 0; i < urls.length; i++) {
    await db.prepare(
      `INSERT INTO card_images (id, card_id, url, reference, source_id, type, created_at) VALUES (lower(hex(randomblob(16))), ?, ?, NULL, ?, ?, unixepoch()*1000)`,
    ).bind(cardId, urls[i], sourceId, type).run();
  }
}

async function getCardWithPrimaryImage(db: TestDatabase, cardId: string) {
  return db
    .prepare(
      `SELECT c.id, c.name, MIN(ci.url) AS url, s.name AS source_name
       FROM cards c
       LEFT JOIN sources s ON c.source_id = s.id
       LEFT JOIN card_images ci ON c.id = ci.card_id
       WHERE c.id = ?
       GROUP BY c.id`,
    )
    .bind(cardId)
    .all();
}

async function getAllImagesForCard(db: TestDatabase, cardId: string) {
  return db
    .prepare('SELECT id, url, type FROM card_images WHERE card_id = ? ORDER BY id')
    .bind(cardId)
    .all();
}

describe('migración 0006 - card_images consultas públicas', () => {
  it('crea la tabla card_images con estructura correcta', async () => {
    const db = await createDatabase();

    const table = await db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='card_images'")
      .first<{ sql: string }>();

    expect(table?.sql).toContain('CREATE TABLE `card_images`');
    expect(table?.sql).toContain('`id` text PRIMARY KEY NOT NULL');
    expect(table?.sql).toContain('DEFAULT (lower(hex(randomblob(16))))');
    expect(table?.sql).toContain('`card_id` text NOT NULL');
    expect(table?.sql).toContain('REFERENCES `cards`(`id`) ON DELETE CASCADE');
    expect(table?.sql).toContain('`url` text NOT NULL');
    expect(table?.sql).toContain('`reference` text');
    expect(table?.sql).toContain('`source_id` text');
    expect(table?.sql).toContain('REFERENCES `sources`(`id`)');
    expect(table?.sql).toContain('`type` text NOT NULL');
    expect(table?.sql).toContain('CHECK (`type` IN');
    expect(table?.sql).toContain("('original','alternate','promotional','other')");
    expect(table?.sql).toContain('`created_at` integer NOT NULL');
    expect(table?.sql).toContain('DEFAULT (unixepoch() * 1000)');
    expect(table?.sql).not.toContain('`is_primary`');
  });

  it('crea índices en card_images', async () => {
    const db = await createDatabase();

    const indexes = await db
      .prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='card_images'")
      .all<{ name: string; sql: string }>();

    const indexNames = indexes.results.map((row: { name: string }) => row.name);
    expect(indexNames).toContain('card_images_card_id_idx');
    expect(indexNames).toContain('card_images_source_id_idx');
    expect(indexNames).not.toContain('card_images_card_id_primary_idx');
  });

  it('backfill inserta imágenes desde cards.image_url cuando hay datos', async () => {
    const db = await createDatabase();

    await insertSource(db);
    await insertCard(db, 'card-1', 'Test Card', 'https://example.com/card1.jpg', 'src-1');

    const before = await countRows(db, 'card_images');

    await db.prepare(`
      INSERT INTO card_images (id, card_id, url, reference, source_id, type, created_at)
      SELECT lower(hex(randomblob(16))), c.id, c.image_url, NULL, c.source_id, 'original', unixepoch()*1000
      FROM cards c
      WHERE c.image_url IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM card_images WHERE card_id = c.id AND url = c.image_url)
    `).run();

    const after = await countRows(db, 'card_images');
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBe(1);
  });

  it('backfill no duplica registros al ejecutarse dos veces', async () => {
    const db = await createDatabase();

    await insertSource(db);
    await insertCard(db, 'card-1', 'Test Card', 'https://example.com/card1.jpg', 'src-1');

    // First backfill
    await db.prepare(`
      INSERT INTO card_images (id, card_id, url, reference, source_id, type, created_at)
      SELECT lower(hex(randomblob(16))), c.id, c.image_url, NULL, c.source_id, 'original', unixepoch()*1000
      FROM cards c
      WHERE c.image_url IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM card_images WHERE card_id = c.id AND url = c.image_url)
    `).run();
    const firstCount = await countRows(db, 'card_images');

    // Second backfill
    await db.prepare(`
      INSERT INTO card_images (id, card_id, url, reference, source_id, type, created_at)
      SELECT lower(hex(randomblob(16))), c.id, c.image_url, NULL, c.source_id, 'original', unixepoch()*1000
      FROM cards c
      WHERE c.image_url IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM card_images WHERE card_id = c.id AND url = c.image_url)
    `).run();
    const secondCount = await countRows(db, 'card_images');

    expect(secondCount).toBe(firstCount);
  });

  it('backfill omite cards sin image_url', async () => {
    const db = await createDatabase();

    await insertSource(db);
    // Card without image_url
    await db.prepare('INSERT INTO cards (id, name, source_id) VALUES (?, ?, ?)').bind('card-1', 'No Image Card', 'src-1').run();

    const before = await countRows(db, 'card_images');

    await db.prepare(`
      INSERT INTO card_images (id, card_id, url, reference, source_id, type, created_at)
      SELECT lower(hex(randomblob(16))), c.id, c.image_url, NULL, c.source_id, 'original', unixepoch()*1000
      FROM cards c
      WHERE c.image_url IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM card_images WHERE card_id = c.id AND url = c.image_url)
    `).run();

    const after = await countRows(db, 'card_images');
    expect(after).toBe(before);
  });

  it('consulta pública: una carta con tres imágenes devuelve una fila y sus tres imágenes', async () => {
    const db = await createDatabase();

    await insertSource(db);
    await insertCard(db, 'card-1', 'Triple Card', 'https://example.com/img1.jpg', 'src-1');
    // Insert 3 images for the same card
    await insertImages(db, 'card-1', [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg',
    ], 'src-1', 'original');

    // Query 1: Main public query - debe retornar UNA sola fila por carta
    const cardResult = await getCardWithPrimaryImage(db, 'card-1');
    expect(cardResult.results).toBeDefined();
    expect(cardResult.results.length).toBe(1); // UNA fila, no 3
    expect(cardResult.results[0].url).toBe('https://example.com/img1.jpg'); // Primera imagen
    expect(cardResult.results[0].source_name).toBe('Test Source');

    // Query 2: Recuperar TODAS las imágenes independientemente
    const allImages = await getAllImagesForCard(db, 'card-1');
    expect(allImages.results).toBeDefined();
    expect(allImages.results.length).toBe(3); // Las 3 imágenes recuperables
    const urls = allImages.results.map((r: { url: string }) => r.url);
    expect(urls).toContain('https://example.com/img1.jpg');
    expect(urls).toContain('https://example.com/img2.jpg');
    expect(urls).toContain('https://example.com/img3.jpg');
  });

  it('consulta pública: una carta con una imagen devuelve una fila y su imagen', async () => {
    const db = await createDatabase();

    await insertSource(db);
    await insertCard(db, 'card-1', 'Single Image Card', 'https://example.com/single.jpg', 'src-1');
    // Insert 1 image for the card
    await insertImages(db, 'card-1', ['https://example.com/single.jpg'], 'src-1', 'original');

    // Query 1: Main public query - UNA sola fila
    const cardResult = await getCardWithPrimaryImage(db, 'card-1');
    expect(cardResult.results.length).toBe(1);
    expect(cardResult.results[0].url).toBe('https://example.com/single.jpg');

    // Query 2: Todas las imágenes - debe haber exactamente 1
    const allImages = await getAllImagesForCard(db, 'card-1');
    expect(allImages.results.length).toBe(1);
    expect(allImages.results[0].url).toBe('https://example.com/single.jpg');
  });

  it('consulta pública: una carta sin imágenes devuelve una fila con url NULL', async () => {
    const db = await createDatabase();

    await insertSource(db);
    // Card without images - no images inserted
    await insertCard(db, 'card-1', 'No Image Card', undefined, 'src-1');

    // Query 1: Main public query - UNA sola fila con url NULL
    const cardResult = await getCardWithPrimaryImage(db, 'card-1');
    expect(cardResult.results.length).toBe(1);
    expect(cardResult.results[0].url).toBeNull();

    // Query 2: No hay imágenes para esta carta
    const allImages = await getAllImagesForCard(db, 'card-1');
    expect(allImages.results.length).toBe(0);
  });

  it('consulta pública: carta con source_version_status superseded sigue visible', async () => {
    const db = await createDatabase();

    await insertSource(db);
    await insertCard(db, 'card-1', 'Card with Version', 'https://example.com/img.jpg', 'src-1');
    // Run backfill
    await db.prepare(`
      INSERT INTO card_images (id, card_id, url, reference, source_id, type, created_at)
      SELECT lower(hex(randomblob(16))), c.id, c.image_url, NULL, c.source_id, 'original', unixepoch()*1000
      FROM cards c
      WHERE c.image_url IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM card_images WHERE card_id = c.id AND url = c.image_url)
    `).run();

    // Main query should still return the card (LEFT JOIN keeps it visible)
    const cardResult = await getCardWithPrimaryImage(db, 'card-1');
    expect(cardResult.results.length).toBe(1);
    expect(cardResult.results[0].url).toBe('https://example.com/img.jpg');
  });
});