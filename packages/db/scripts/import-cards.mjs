#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FORMAT = 'digimon-judge-cards/v1';
const CARD_ID_PATTERN = /^[A-Z][A-Z0-9]*-[A-Z0-9]{2,4}$/;
const RULE_STATUSES = ['official', 'interpretation', 'pending', 'superseded'];
const SOURCE_KINDS = [
  'official_rules',
  'official_cardlist',
  'official_faq',
  'official_errata',
  'official_banlist',
  'community',
  'internal',
];
const IMAGE_TYPES = ['original', 'alternate', 'promotional', 'other'];

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function usage() {
  console.log(
    [
      'Uso: node packages/db/scripts/import-cards.mjs <archivo.json> [opciones]',
      '',
      'Opciones:',
      '  --apply             Escribe en la base local (por defecto solo simula).',
      '  --update            Permite actualizar cartas existentes si el texto difiere.',
      '  --allow-unofficial  Permite aplicar un archivo con source.official = false.',
      '  --new-version       Crea una versión pendiente si la fuente ya tiene otra vigente.',
      '  --db <ruta>         Ruta explícita al SQLite local de D1.',
      '  --actor <etiqueta>  Etiqueta del actor registrada en la importación.',
    ].join('\n'),
  );
}

function parseArgs(argv) {
  const options = {
    file: null,
    apply: false,
    update: false,
    allowUnofficial: false,
    allowNewVersion: false,
    dbPath: null,
    actor: 'local-importer',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') options.apply = true;
    else if (arg === '--update') options.update = true;
    else if (arg === '--allow-unofficial') options.allowUnofficial = true;
    else if (arg === '--new-version') options.allowNewVersion = true;
    else if (arg === '--db') options.dbPath = argv[++index] ?? null;
    else if (arg === '--actor') options.actor = argv[++index] ?? '';
    else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      throw new Error(`Opción desconocida: ${arg}`);
    } else if (options.file) {
      throw new Error(`Argumento inesperado: ${arg}`);
    } else {
      options.file = arg;
    }
  }

  if (!options.file) throw new Error('Falta la ruta del archivo JSON.');
  if (!options.actor.trim()) throw new Error('El actor no puede estar vacío.');
  return options;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isString(value) {
  return typeof value === 'string';
}

function isIsoDate(value) {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isOptionalInteger(value) {
  return value === undefined || value === null || (Number.isInteger(value) && value >= 0);
}

function validateImport(raw) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(raw)) {
    return { errors: ['El archivo debe contener un objeto JSON.'], warnings, data: null };
  }
  if (raw.format !== FORMAT) {
    errors.push(`format debe ser "${FORMAT}".`);
  }

  const source = raw.source;
  if (!isPlainObject(source)) {
    errors.push('Falta el objeto source.');
  } else {
    if (!isNonEmptyString(source.stableKey)) errors.push('source.stableKey es obligatorio.');
    if (!isNonEmptyString(source.name)) errors.push('source.name es obligatorio.');
    if (typeof source.official !== 'boolean') errors.push('source.official debe ser booleano.');
    if (!isNonEmptyString(source.version)) errors.push('source.version es obligatorio.');
    if (!isNonEmptyString(source.title)) errors.push('source.title es obligatorio.');
    if (!isIsoDate(source.retrievedAt)) errors.push('source.retrievedAt debe ser una fecha ISO.');
    if (source.kind !== undefined && !SOURCE_KINDS.includes(source.kind)) {
      errors.push(`source.kind debe ser uno de: ${SOURCE_KINDS.join(', ')}.`);
    }
    if (source.url !== undefined && !isHttpUrl(source.url)) {
      errors.push('source.url debe ser una URL http(s).');
    }
    if (source.publishedAt !== undefined && !isIsoDate(source.publishedAt)) {
      errors.push('source.publishedAt debe ser una fecha ISO.');
    }
    if (source.official === true && typeof source.kind === 'string' && !source.kind.startsWith('official_')) {
      warnings.push('source.official = true pero source.kind no es oficial.');
    }
    if (source.official === false && typeof source.kind === 'string' && source.kind.startsWith('official_')) {
      errors.push('source.official = false no puede usar un kind oficial.');
    }
  }

  const cards = raw.cards;
  if (!Array.isArray(cards) || cards.length === 0) {
    errors.push('cards debe ser un arreglo con al menos una carta.');
    return { errors, warnings, data: null };
  }

  const seenIds = new Set();
  cards.forEach((card, index) => {
    const prefix = `cards[${index}]`;
    if (!isPlainObject(card)) {
      errors.push(`${prefix} debe ser un objeto.`);
      return;
    }
    if (!isNonEmptyString(card.id) || !CARD_ID_PATTERN.test(card.id)) {
      errors.push(`${prefix}.id debe tener formato oficial (ej. BT1-001).`);
    } else if (seenIds.has(card.id)) {
      errors.push(`${prefix}.id duplicado en el archivo: ${card.id}.`);
    } else {
      seenIds.add(card.id);
    }
    if (!isNonEmptyString(card.name)) errors.push(`${prefix}.name es obligatorio.`);
    if (!isString(card.officialText)) errors.push(`${prefix}.officialText debe ser texto.`);
    if (card.status !== undefined && !RULE_STATUSES.includes(card.status)) {
      errors.push(`${prefix}.status debe ser uno de: ${RULE_STATUSES.join(', ')}.`);
    }
    if (source && source.official === false && card.status === 'official') {
      errors.push(`${prefix}.status no puede ser official si source.official es false.`);
    }
    for (const field of ['nameEn', 'nameJa', 'cardType', 'color', 'form', 'attribute', 'rarity', 'sourceLocator']) {
      if (card[field] !== undefined && !isString(card[field])) {
        errors.push(`${prefix}.${field} debe ser texto.`);
      }
    }
    for (const field of ['level', 'dp', 'playCost', 'evolutionCost']) {
      if (!isOptionalInteger(card[field])) {
        errors.push(`${prefix}.${field} debe ser un entero no negativo.`);
      }
    }
    if (card.imageUrl !== undefined && !isHttpUrl(card.imageUrl)) {
      errors.push(`${prefix}.imageUrl debe ser una URL http(s).`);
    }
    if (card.set !== undefined) {
      if (!isPlainObject(card.set)) errors.push(`${prefix}.set debe ser un objeto.`);
      else {
        if (!isNonEmptyString(card.set.id)) errors.push(`${prefix}.set.id es obligatorio.`);
        if (!isNonEmptyString(card.set.code)) errors.push(`${prefix}.set.code es obligatorio.`);
        if (!isNonEmptyString(card.set.name)) errors.push(`${prefix}.set.name es obligatorio.`);
      }
    }
    if (card.images !== undefined) {
      if (!Array.isArray(card.images)) errors.push(`${prefix}.images debe ser un arreglo.`);
      else {
        card.images.forEach((image, imageIndex) => {
          const imagePrefix = `${prefix}.images[${imageIndex}]`;
          if (!isPlainObject(image)) {
            errors.push(`${imagePrefix} debe ser un objeto.`);
            return;
          }
          if (!isHttpUrl(image.url)) errors.push(`${imagePrefix}.url debe ser una URL http(s).`);
          if (!IMAGE_TYPES.includes(image.type)) {
            errors.push(`${imagePrefix}.type debe ser uno de: ${IMAGE_TYPES.join(', ')}.`);
          }
          if (image.reference !== undefined && !isString(image.reference)) {
            errors.push(`${imagePrefix}.reference debe ser texto.`);
          }
        });
      }
    }
  });

  return { errors, warnings, data: errors.length === 0 ? { source, cards } : null };
}

function findLocalDb() {
  const directory = join(repoRoot, 'apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (!existsSync(directory)) {
    throw new Error('No se encontró el estado local de D1. Ejecuta primero npm run db:migrate:local.');
  }
  const files = readdirSync(directory).filter((file) => file.endsWith('.sqlite') && file !== 'metadata.sqlite');
  if (files.length !== 1) {
    throw new Error(`Se esperaba un archivo D1 local y se encontraron ${files.length}. Usa --db.`);
  }
  return join(directory, files[0]);
}

async function openDatabase(path) {
  const { DatabaseSync } = await import('node:sqlite');
  const database = new DatabaseSync(path);
  database.exec('PRAGMA foreign_keys = ON');
  database.exec('PRAGMA busy_timeout = 5000');
  return database;
}

function resolveSource(database, source, version, options, now) {
  const kind = source.kind ?? (source.official ? 'official_cardlist' : 'internal');
  const retrievedAt = Date.parse(source.retrievedAt);
  const publishedAt = source.publishedAt ? Date.parse(source.publishedAt) : null;

  let sourceRow = database
    .prepare('SELECT id, stable_key, current_version_id FROM sources WHERE stable_key = ?')
    .get(source.stableKey);

  if (!sourceRow) {
    sourceRow = { id: randomUUID(), stable_key: source.stableKey, current_version_id: null };
    database
      .prepare(
        `INSERT INTO sources (id, stable_key, kind, name, publisher, url, official, checksum, retrieved_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        sourceRow.id,
        source.stableKey,
        kind,
        source.name,
        source.publisher ?? null,
        source.url ?? null,
        source.official ? 1 : 0,
        version.checksum,
        retrievedAt,
        now,
        now,
      );
  }

  const current = sourceRow.current_version_id
    ? database.prepare('SELECT id, version FROM source_versions WHERE id = ?').get(sourceRow.current_version_id)
    : null;

  if (current && current.version !== source.version && !options.allowNewVersion) {
    throw new Error(
      `La fuente "${source.stableKey}" ya tiene la versión vigente "${current.version}". ` +
        'Usa --new-version si deseas registrar una versión pendiente distinta.',
    );
  }

  const existingVersion = database
    .prepare('SELECT id, version FROM source_versions WHERE source_id = ? AND version = ?')
    .get(sourceRow.id, source.version);

  if (existingVersion) {
    return { sourceId: sourceRow.id, versionId: existingVersion.id, createdSource: false };
  }

  const versionId = randomUUID();
  database
    .prepare(
      `INSERT INTO source_versions (id, source_id, version, status, title, url, language, published_at, retrieved_at, checksum, created_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      versionId,
      sourceRow.id,
      source.version,
      source.title,
      source.url ?? null,
      source.language ?? null,
      publishedAt,
      retrievedAt,
      version.checksum,
      now,
    );

  if (!sourceRow.current_version_id) {
    database.prepare("UPDATE source_versions SET status = 'current' WHERE id = ?").run(versionId);
    database.prepare('UPDATE sources SET current_version_id = ? WHERE id = ?').run(versionId, sourceRow.id);
  }

  return { sourceId: sourceRow.id, versionId, createdSource: !current };
}

function ensureSet(database, setId, set, sourceId, versionId, now, report) {
  const existing = database.prepare('SELECT id, code, name FROM card_sets WHERE id = ?').get(setId);
  if (existing) {
    if (existing.code !== set.code || existing.name !== set.name) {
      report.warnings.push(`El set ${setId} ya existe con otro código o nombre; se reutiliza el existente.`);
    }
    return;
  }
  database
    .prepare(
      `INSERT INTO card_sets (id, code, name, source_id, source_version_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(setId, set.code, set.name, sourceId, versionId, now, now);
  report.actions.setsInserted += 1;
}

function cardRecord(card, sourceId, versionId) {
  return {
    name: card.name,
    name_en: card.nameEn ?? null,
    name_ja: card.nameJa ?? null,
    set_id: card.set?.id ?? null,
    card_type: card.cardType ?? null,
    color: card.color ?? null,
    level: card.level ?? null,
    dp: card.dp ?? null,
    play_cost: card.playCost ?? null,
    evolution_cost: card.evolutionCost ?? null,
    form: card.form ?? null,
    attribute: card.attribute ?? null,
    rarity: card.rarity ?? null,
    image_url: card.imageUrl ?? null,
    official_text: card.officialText,
    status: card.status ?? 'pending',
    source_id: sourceId,
    source_version_id: versionId,
    source_locator: card.sourceLocator ?? null,
  };
}

function record(card, sourceId, versionId) {
  return { ...cardRecord(card, sourceId, versionId), id: card.id };
}

const CARD_COLUMNS = [
  'id',
  'name',
  'name_en',
  'name_ja',
  'set_id',
  'card_type',
  'color',
  'level',
  'dp',
  'play_cost',
  'evolution_cost',
  'form',
  'attribute',
  'rarity',
  'image_url',
  'official_text',
  'status',
  'source_id',
  'source_version_id',
  'source_locator',
];

function isUnchanged(existing, incoming) {
  return CARD_COLUMNS.every((column) => {
    const left = existing[column] ?? null;
    const right = incoming[column] ?? null;
    return left === right;
  });
}

function insertAudit(database, { entityType, entityId, sourceId, versionId, actor, after, now }) {
  database
    .prepare(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, actor_subject, source_id, source_version_id, after_json, created_at)
       VALUES (?, ?, ?, 'import', ?, ?, ?, ?, ?)`,
    )
    .run(randomUUID(), entityType, entityId, actor, sourceId, versionId, JSON.stringify(after), now);
}

function applyImport(database, { source, cards }, options, checksum) {
  const now = Date.now();
  const version = { checksum };
  const report = {
    source: { stableKey: source.stableKey, version: source.version, official: source.official },
    actions: { inserted: 0, updated: 0, unchanged: 0, conflicts: 0, imagesInserted: 0, setsInserted: 0 },
    warnings: [],
    errors: [],
  };
  const actorSubject = options.actor;

  database.exec('BEGIN IMMEDIATE');
  try {
    const { sourceId, versionId, createdSource } = resolveSource(database, source, version, options, now);
    const previewId = randomUUID();
    const batchId = randomUUID();
    const previewHash = createHash('sha256')
      .update(`${checksum}:${actorSubject}:${source.stableKey}:${source.version}`)
      .digest('hex');

    const duplicateBatch = database
      .prepare('SELECT id FROM import_batches WHERE source_version_id = ? AND content_checksum = ?')
      .get(versionId, checksum);
    if (duplicateBatch) {
      throw new Error(
        `Este contenido ya fue importado para la versión "${source.version}". ` +
          'Para corregir datos usa un archivo con cambios (checksum distinto) o una nueva versión de la fuente.',
      );
    }

    database
      .prepare(
        `INSERT INTO import_previews (id, preview_hash, content_checksum, format, entity, source_stable_key, source_version, report_json, actor_subject, actor_label, created_at, expires_at, used_at)
         VALUES (?, ?, ?, 'json', 'cards', ?, ?, '{}', ?, ?, ?, ?, ?)`,
      )
      .run(
        previewId,
        previewHash,
        checksum,
        source.stableKey,
        source.version,
        actorSubject,
        actorSubject,
        now,
        now + 24 * 60 * 60 * 1000,
        now,
      );

    database
      .prepare(
        `INSERT INTO import_batches (id, preview_id, source_id, source_version_id, format, content_checksum, preview_hash, status, counts_json, report_json, actor_subject, actor_label, created_at, applied_at)
         VALUES (?, ?, ?, ?, 'json', ?, ?, 'applied', '{}', '{}', ?, ?, ?, ?)`,
      )
      .run(batchId, previewId, sourceId, versionId, checksum, previewHash, actorSubject, actorSubject, now, now);

    database.prepare('UPDATE import_previews SET used_by_batch_id = ? WHERE id = ?').run(batchId, previewId);

    for (const card of cards) {
      if (card.set) {
        ensureSet(database, card.set.id, card.set, sourceId, versionId, now, report);
      }

      const incoming = record(card, sourceId, versionId);
      const existing = database.prepare('SELECT * FROM cards WHERE id = ?').get(card.id);

      if (existing && isUnchanged(existing, incoming)) {
        report.actions.unchanged += 1;
      } else if (existing && !options.update) {
        database
          .prepare(
            `INSERT INTO content_conflicts (id, entity_type, entity_key, existing_source_id, existing_source_version_id, incoming_source_id, incoming_source_version_id, existing_json, incoming_json, status, detected_at, import_batch_id)
             VALUES (?, 'card', ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
          )
          .run(
            randomUUID(),
            card.id,
            existing.source_id ?? null,
            existing.source_version_id ?? null,
            sourceId,
            versionId,
            JSON.stringify(existing),
            JSON.stringify(incoming),
            now,
            batchId,
          );
        report.actions.conflicts += 1;
      } else if (existing) {
        database
          .prepare(
            `UPDATE cards SET name = ?, name_en = ?, name_ja = ?, set_id = ?, card_type = ?, color = ?, level = ?, dp = ?, play_cost = ?, evolution_cost = ?, form = ?, attribute = ?, rarity = ?, image_url = ?, official_text = ?, status = ?, source_id = ?, source_version_id = ?, source_locator = ?, updated_at = ? WHERE id = ?`,
          )
          .run(
            incoming.name,
            incoming.name_en,
            incoming.name_ja,
            incoming.set_id,
            incoming.card_type,
            incoming.color,
            incoming.level,
            incoming.dp,
            incoming.play_cost,
            incoming.evolution_cost,
            incoming.form,
            incoming.attribute,
            incoming.rarity,
            incoming.image_url,
            incoming.official_text,
            incoming.status,
            incoming.source_id,
            incoming.source_version_id,
            incoming.source_locator,
            now,
            card.id,
          );
        report.actions.updated += 1;
        insertAudit(database, {
          entityType: 'card',
          entityId: card.id,
          sourceId,
          versionId,
          actor: actorSubject,
          after: incoming,
          now,
        });
      } else {
        const columns = CARD_COLUMNS.join(', ');
        const placeholders = CARD_COLUMNS.map(() => '?').join(', ');
        database
          .prepare(`INSERT INTO cards (${columns}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`)
          .run(...CARD_COLUMNS.map((column) => incoming[column]), now, now);
        report.actions.inserted += 1;
        insertAudit(database, {
          entityType: 'card',
          entityId: card.id,
          sourceId,
          versionId,
          actor: actorSubject,
          after: incoming,
          now,
        });
      }

      for (const image of card.images ?? []) {
        const existingImage = database
          .prepare('SELECT id FROM card_images WHERE card_id = ? AND url = ?')
          .get(card.id, image.url);
        if (!existingImage) {
          database
            .prepare(
              `INSERT INTO card_images (id, card_id, url, reference, source_id, type, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(randomUUID(), card.id, image.url, image.reference ?? null, sourceId, image.type, now);
          report.actions.imagesInserted += 1;
        }
      }
    }

    const counts = { cards: cards.length, ...report.actions, sourceCreated: createdSource };
    const status =
      counts.conflicts > 0 && counts.inserted === 0 && counts.updated === 0 ? 'rejected' : 'applied';
    database
      .prepare('UPDATE import_batches SET status = ?, counts_json = ?, report_json = ? WHERE id = ?')
      .run(status, JSON.stringify(counts), JSON.stringify(report), batchId);
    database
      .prepare('UPDATE import_previews SET report_json = ? WHERE id = ?')
      .run(JSON.stringify(report), previewId);

    insertAudit(database, {
      entityType: 'import_batch',
      entityId: batchId,
      sourceId,
      versionId,
      actor: actorSubject,
      after: counts,
      now,
    });

    database.exec('COMMIT');
    return { report, batchId };
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const filePath = isAbsolute(options.file) ? options.file : resolve(process.cwd(), options.file);
  const content = readFileSync(filePath);
  const checksum = createHash('sha256').update(content).digest('hex');

  let raw;
  try {
    raw = JSON.parse(content.toString('utf8'));
  } catch (error) {
    throw new Error(`JSON inválido: ${error.message}`, { cause: error });
  }

  const { errors, warnings, data } = validateImport(raw);
  const invalidCards = errors.filter((error) => error.startsWith('cards[')).length;

  if (errors.length > 0) {
    console.error(`Archivo inválido (${errors.length} errores):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const summary = {
    archivo: filePath,
    checksum,
    source: {
      stableKey: data.source.stableKey,
      version: data.source.version,
      official: data.source.official,
    },
    cartas: data.cards.length,
    conjuntos: data.cards.filter((card) => card.set).length,
    imagenes: data.cards.reduce((total, card) => total + (card.images?.length ?? 0), 0),
    avisos: [...warnings, ...(invalidCards > 0 ? [`${invalidCards} cartas con errores.`] : [])],
  };

  if (!options.apply) {
    console.log(JSON.stringify({ modo: 'simulacion', ...summary }, null, 2));
    return;
  }

  if (data.source.official === false && !options.allowUnofficial) {
    throw new Error(
      'El archivo declara source.official = false. Usa --allow-unofficial sólo con datos de prueba.',
    );
  }

  const dbPath = options.dbPath ? resolve(process.cwd(), options.dbPath) : findLocalDb();
  const database = await openDatabase(dbPath);
  try {
    const { report, batchId } = applyImport(database, data, options, checksum);
    console.log(JSON.stringify({ modo: 'aplicado', batchId, ...summary, resultado: report }, null, 2));
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
