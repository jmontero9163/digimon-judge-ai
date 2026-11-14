import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const migrationName = '0005_source_current_version.sql';

type TestDatabase = Awaited<ReturnType<Miniflare['getD1Database']>>;
type VersionStatus = 'pending' | 'current' | 'superseded';

interface VersionOptions {
  id: string;
  sourceId?: string;
  version?: string;
  status?: VersionStatus;
  supersededAt?: number | null;
  supersededByVersionId?: string | null;
}

let runtime: Miniflare | undefined;

afterEach(async () => {
  await runtime?.dispose();
  runtime = undefined;
});

function migrationFiles(through = '0005'): string[] {
  return readdirSync(migrationsDir)
    .filter((file) => /^\d{4}_.*\.sql$/.test(file) && file.slice(0, 4) <= through)
    .sort();
}

async function applyMigrationFile(db: TestDatabase, file: string): Promise<void> {
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

async function createDatabase(through = '0005'): Promise<TestDatabase> {
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

  return db;
}

async function insertSource(db: TestDatabase, id = 'src-1'): Promise<void> {
  await db
    .prepare('INSERT INTO sources (id, kind, name) VALUES (?, ?, ?)')
    .bind(id, 'internal', `Source ${id}`)
    .run();
}

function insertVersionStatement(db: TestDatabase, options: VersionOptions) {
  const {
    id,
    sourceId = 'src-1',
    version = '1',
    status = 'pending',
    supersededAt = null,
    supersededByVersionId = null,
  } = options;

  return db
    .prepare(
      `INSERT INTO source_versions
        (id, source_id, version, status, title, retrieved_at, checksum, superseded_at, superseded_by_version_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      sourceId,
      version,
      status,
      `Version ${id}`,
      1_700_000_000_000,
      `checksum-${id}`,
      supersededAt,
      supersededByVersionId,
    );
}

async function insertVersion(db: TestDatabase, options: VersionOptions): Promise<void> {
  await insertVersionStatement(db, options).run();
}

function insertLegacyVersionStatement(
  db: TestDatabase,
  options: {
    id: string;
    sourceId?: string;
    version?: string;
    supersededAt?: number | null;
    supersededByVersionId?: string | null;
  },
) {
  const {
    id,
    sourceId = 'src-1',
    version = '1',
    supersededAt = null,
    supersededByVersionId = null,
  } = options;

  return db
    .prepare(
      `INSERT INTO source_versions
        (id, source_id, version, title, retrieved_at, checksum, superseded_at, superseded_by_version_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      sourceId,
      version,
      `Version ${id}`,
      1_700_000_000_000,
      `checksum-${id}`,
      supersededAt,
      supersededByVersionId,
    );
}

async function createSourceWithCurrentVersion(
  db: TestDatabase,
  sourceId = 'src-1',
  versionId = 'ver-1',
  version = '1',
): Promise<void> {
  await insertSource(db, sourceId);
  await insertVersion(db, { id: versionId, sourceId, version });
  await db.batch([
    db.prepare('UPDATE source_versions SET status = ? WHERE id = ?').bind('current', versionId),
    db.prepare('UPDATE sources SET current_version_id = ? WHERE id = ?').bind(versionId, sourceId),
  ]);
}

function transitionStatements(
  db: TestDatabase,
  options: {
    sourceId?: string;
    currentVersionId?: string;
    nextVersionId?: string;
    nextVersion?: string;
    auditId?: string;
  } = {},
) {
  const {
    sourceId = 'src-1',
    currentVersionId = 'ver-1',
    nextVersionId = 'ver-2',
    nextVersion = '2',
    auditId = 'audit-1',
  } = options;

  return [
    insertVersionStatement(db, { id: nextVersionId, sourceId, version: nextVersion }),
    db
      .prepare(
        'UPDATE source_versions SET status = ?, superseded_at = ?, superseded_by_version_id = ? WHERE id = ?',
      )
      .bind('superseded', 1_700_000_000_001, nextVersionId, currentVersionId),
    db.prepare('UPDATE source_versions SET status = ? WHERE id = ?').bind('current', nextVersionId),
    db
      .prepare('UPDATE sources SET current_version_id = ? WHERE id = ?')
      .bind(nextVersionId, sourceId),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, entity_type, entity_id, action, source_id, source_version_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(auditId, 'source_version', nextVersionId, 'update', sourceId, nextVersionId),
  ];
}

async function getSource(db: TestDatabase, id = 'src-1') {
  return db
    .prepare('SELECT current_version_id FROM sources WHERE id = ?')
    .bind(id)
    .first<{ current_version_id: string | null }>();
}

async function getVersion(db: TestDatabase, id: string) {
  return db
    .prepare(
      'SELECT status, superseded_at, superseded_by_version_id FROM source_versions WHERE id = ?',
    )
    .bind(id)
    .first<{
      status: string;
      superseded_at: number | null;
      superseded_by_version_id: string | null;
    }>();
}

async function countRows(db: TestDatabase, table: string): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>();
  return row?.count ?? 0;
}

describe('migración 0005', () => {
  it('rechaza varias versiones no supersedidas de una misma fuente', async () => {
    const db = await createDatabase('0004');
    await insertSource(db);
    await db.prepare('DROP INDEX source_versions_current_unique').run();
    await insertLegacyVersionStatement(db, { id: 'legacy-1', version: '1' }).run();
    await insertLegacyVersionStatement(db, { id: 'legacy-2', version: '2' }).run();

    await expect(applyMigrationFile(db, migrationName)).rejects.toThrow(
      /multiple unsuperseded versions/,
    );
  });

  it('rechaza un estado histórico de supersesión inconsistente', async () => {
    const db = await createDatabase('0004');
    await insertSource(db);
    await insertLegacyVersionStatement(db, {
      id: 'legacy-1',
      supersededAt: 1_700_000_000_000,
      supersededByVersionId: null,
    }).run();

    await expect(applyMigrationFile(db, migrationName)).rejects.toThrow(
      /inconsistent historical supersession state/,
    );
  });

  it('rellena el puntero y el estado de una fuente válida', async () => {
    const db = await createDatabase('0004');
    await insertSource(db);
    await insertLegacyVersionStatement(db, { id: 'legacy-current', version: '2' }).run();
    await insertLegacyVersionStatement(db, {
      id: 'legacy-old',
      version: '1',
      supersededAt: 1_700_000_000_000,
      supersededByVersionId: 'legacy-current',
    }).run();

    await applyMigrationFile(db, migrationName);

    expect(await getSource(db)).toEqual({ current_version_id: 'legacy-current' });
    expect(await getVersion(db, 'legacy-current')).toMatchObject({
      status: 'current',
      superseded_at: null,
      superseded_by_version_id: null,
    });
    expect(await getVersion(db, 'legacy-old')).toMatchObject({
      status: 'superseded',
      superseded_by_version_id: 'legacy-current',
    });

    const guards = await db
      .prepare("SELECT name FROM sqlite_master WHERE name LIKE '_migration_guard_%'")
      .all<{ name: string }>();
    expect(guards.results).toEqual([]);
  });

  it('deja el CHECK, los índices y los triggers esperados', async () => {
    const db = await createDatabase();

    const table = await db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'source_versions'")
      .first<{ sql: string }>();
    expect(table?.sql).toContain("CHECK (status IN ('pending', 'current', 'superseded'))");

    const schemaObjects = await db
      .prepare("SELECT type, name FROM sqlite_master WHERE type IN ('index', 'trigger')")
      .all();
    const schemaRows = schemaObjects.results as Array<{ type: string; name: string }>;
    const names = new Set(schemaRows.map((row) => row.name));

    for (const name of [
      'source_versions_current_status_unique',
      'sources_current_version_unique',
      'source_versions_insert_pending_only',
      'source_versions_no_delete',
      'source_versions_original_fields_immutable',
      'source_versions_superseded_is_terminal',
      'source_versions_status_transition_allowed',
      'source_versions_state_fields_consistent',
      'source_versions_no_self_supersession',
      'source_versions_current_to_superseded_valid',
      'source_versions_pending_to_current_valid',
      'sources_current_version_valid_insert',
      'sources_current_version_valid_update',
      'sources_current_version_no_clear_update',
      'sources_current_version_transition_consistent_update',
      'source_versions_supersession_match_insert',
      'source_versions_supersession_match_update',
    ]) {
      expect(names.has(name), name).toBe(true);
    }

    expect(names.has('source_versions_current_unique')).toBe(false);
    expect(names.has('source_versions_second_unsuperseded_requires_current_pointer')).toBe(false);

    const triggers = schemaRows.filter((row) => row.type === 'trigger');
    expect(triggers).toHaveLength(49);
  });

  it('deja la integridad referencial limpia', async () => {
    const db = await createDatabase();
    const violations = await db.prepare('PRAGMA foreign_key_check').all();
    expect(violations.results).toEqual([]);
  });
});

describe('estado de versiones', () => {
  it('permite varias versiones pending y promueve solo una', async () => {
    const db = await createDatabase();
    await insertSource(db);
    await insertVersion(db, { id: 'ver-1', version: '1' });
    await insertVersion(db, { id: 'ver-2', version: '2' });
    await insertVersion(db, { id: 'ver-3', version: '3' });

    expect(await countRows(db, 'source_versions')).toBe(3);

    await db.batch([
      db.prepare('UPDATE source_versions SET status = ? WHERE id = ?').bind('current', 'ver-1'),
      db.prepare('UPDATE sources SET current_version_id = ? WHERE id = ?').bind('ver-1', 'src-1'),
    ]);

    expect(await getVersion(db, 'ver-1')).toMatchObject({ status: 'current' });
    expect(await getVersion(db, 'ver-2')).toMatchObject({ status: 'pending' });
    expect(await getVersion(db, 'ver-3')).toMatchObject({ status: 'pending' });
    expect(await getSource(db)).toEqual({ current_version_id: 'ver-1' });
  });

  it('rechaza insertar versiones que no estén pending y sin supersesión', async () => {
    const db = await createDatabase();
    await insertSource(db);

    await expect(
      insertVersion(db, { id: 'ver-current', version: '1', status: 'current' }),
    ).rejects.toThrow(/must be pending/);
    await expect(
      insertVersion(db, {
        id: 'ver-superseded',
        version: '2',
        status: 'superseded',
        supersededAt: 1_700_000_000_000,
        supersededByVersionId: 'ver-current',
      }),
    ).rejects.toThrow(/must be pending/);
    await expect(
      insertVersion(db, {
        id: 'ver-pending-with-supersession',
        version: '3',
        supersededAt: 1_700_000_000_000,
      }),
    ).rejects.toThrow(/must be pending/);

    expect(await countRows(db, 'source_versions')).toBe(0);
  });

  it('rechaza reactivar una versión superseded', async () => {
    const db = await createDatabase();
    await createSourceWithCurrentVersion(db);
    await db.batch(transitionStatements(db));

    await expect(
      db
        .prepare('UPDATE source_versions SET status = ? WHERE id = ?')
        .bind('current', 'ver-1')
        .run(),
    ).rejects.toThrow(
      /superseded source_versions are immutable|invalid source_versions status|status and supersession fields are inconsistent/,
    );
  });

  it('rechaza transiciones de estado no permitidas', async () => {
    const db = await createDatabase();
    await createSourceWithCurrentVersion(db);
    await insertVersion(db, { id: 'ver-2', version: '2' });

    await expect(
      db
        .prepare('UPDATE source_versions SET status = ? WHERE id = ?')
        .bind('pending', 'ver-1')
        .run(),
    ).rejects.toThrow(
      /invalid source_versions status transition|status and supersession fields are inconsistent/,
    );

    await expect(
      db
        .prepare('UPDATE source_versions SET status = ? WHERE id = ?')
        .bind('superseded', 'ver-2')
        .run(),
    ).rejects.toThrow(
      /invalid source_versions status transition|status and supersession fields are inconsistent/,
    );
  });

  it('rechaza modificar campos originales y borrar versiones', async () => {
    const db = await createDatabase();
    await createSourceWithCurrentVersion(db);

    await expect(
      db
        .prepare('UPDATE source_versions SET title = ? WHERE id = ?')
        .bind('changed', 'ver-1')
        .run(),
    ).rejects.toThrow(/original fields are immutable/);

    await expect(
      db.prepare('DELETE FROM source_versions WHERE id = ?').bind('ver-1').run(),
    ).rejects.toThrow(/cannot be deleted/);
  });
});

describe('puntero de versión actual', () => {
  it('rechaza apuntar a una versión pending', async () => {
    const db = await createDatabase();
    await insertSource(db);
    await insertVersion(db, { id: 'ver-1', version: '1' });

    await expect(
      db
        .prepare('UPDATE sources SET current_version_id = ? WHERE id = ?')
        .bind('ver-1', 'src-1')
        .run(),
    ).rejects.toThrow(/must reference a current source_version/);
  });

  it('rechaza apuntar a una versión superseded', async () => {
    const db = await createDatabase();
    await createSourceWithCurrentVersion(db);
    await db.batch(transitionStatements(db));

    await expect(
      db
        .prepare('UPDATE sources SET current_version_id = ? WHERE id = ?')
        .bind('ver-1', 'src-1')
        .run(),
    ).rejects.toThrow(/must reference a current source_version|invalid sources.current_version_id/);
  });

  it('rechaza limpiar el puntero una vez asignado', async () => {
    const db = await createDatabase();
    await createSourceWithCurrentVersion(db);

    await expect(
      db.prepare('UPDATE sources SET current_version_id = NULL WHERE id = ?').bind('src-1').run(),
    ).rejects.toThrow(/cannot be cleared/);
  });

  it('aplica la transición atómica completa', async () => {
    const db = await createDatabase();
    await createSourceWithCurrentVersion(db);

    await db.batch(transitionStatements(db));

    expect(await getVersion(db, 'ver-1')).toMatchObject({
      status: 'superseded',
      superseded_by_version_id: 'ver-2',
    });
    expect(await getVersion(db, 'ver-2')).toMatchObject({
      status: 'current',
      superseded_at: null,
      superseded_by_version_id: null,
    });
    expect(await getSource(db)).toEqual({ current_version_id: 'ver-2' });
    expect(await countRows(db, 'audit_log')).toBe(1);
  });

  it.each([
    [0, 'insertar la siguiente versión'],
    [1, 'marcar la versión actual como superseded'],
    [2, 'promover la siguiente versión'],
    [3, 'actualizar el puntero'],
    [4, 'registrar la auditoría'],
  ])('revierte la transición si falla el paso %i (%s)', async (failureIndex) => {
    const db = await createDatabase();
    await createSourceWithCurrentVersion(db);

    const statements = transitionStatements(db);
    const failures = [
      insertVersionStatement(db, { id: 'ver-1', version: 'duplicate' }),
      db
        .prepare(
          'UPDATE source_versions SET status = ?, superseded_at = ?, superseded_by_version_id = ? WHERE id = ?',
        )
        .bind('superseded', 1_700_000_000_001, 'missing', 'ver-1'),
      db.prepare('UPDATE source_versions SET status = ? WHERE id = ?').bind('superseded', 'ver-2'),
      db.prepare('UPDATE sources SET current_version_id = ? WHERE id = ?').bind('missing', 'src-1'),
      db
        .prepare(
          `INSERT INTO audit_log
            (id, entity_type, entity_id, action, source_id, source_version_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind('audit-bad', 'source_version', 'ver-2', 'update', 'src-1', 'missing'),
    ];

    const failure = failures[failureIndex];
    if (!failure) {
      throw new Error(`Missing failure statement for index ${failureIndex}`);
    }

    statements[failureIndex] = failure;

    await expect(db.batch(statements)).rejects.toThrow();

    expect(await getVersion(db, 'ver-1')).toMatchObject({ status: 'current' });
    expect(await getVersion(db, 'ver-2')).toBeNull();
    expect(await getSource(db)).toEqual({ current_version_id: 'ver-1' });
    expect(await countRows(db, 'audit_log')).toBe(0);
  });
});
