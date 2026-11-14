import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sources, sourceVersions } from './sources';

export const importPreviews = sqliteTable(
  'import_previews',
  {
    id: text('id').primaryKey().notNull(),
    previewHash: text('preview_hash').notNull(),
    contentChecksum: text('content_checksum').notNull(),
    format: text('format', { enum: ['json', 'csv'] }).notNull(),
    entity: text('entity').notNull(),
    sourceStableKey: text('source_stable_key'),
    sourceVersion: text('source_version'),
    reportJson: text('report_json').notNull().default('{}'),
    actorSubject: text('actor_subject').notNull(),
    actorLabel: text('actor_label'),
    requestId: text('request_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('used_at', { mode: 'timestamp_ms' }),
    usedByBatchId: text('used_by_batch_id'),
  },
  (table) => [
    uniqueIndex('import_previews_preview_hash_unique').on(table.previewHash),
    index('import_previews_source_idx').on(table.sourceStableKey, table.sourceVersion),
    index('import_previews_expires_idx').on(table.expiresAt),
    index('import_previews_used_idx').on(table.usedAt),
  ],
);

export const importBatches = sqliteTable(
  'import_batches',
  {
    id: text('id').primaryKey().notNull(),
    previewId: text('preview_id')
      .notNull()
      .references(() => importPreviews.id),
    sourceId: text('source_id').references(() => sources.id),
    sourceVersionId: text('source_version_id').references(() => sourceVersions.id),
    format: text('format', { enum: ['json', 'csv'] }).notNull(),
    contentChecksum: text('content_checksum').notNull(),
    previewHash: text('preview_hash').notNull(),
    status: text('status', { enum: ['applied', 'rejected'] }).notNull(),
    countsJson: text('counts_json').notNull().default('{}'),
    reportJson: text('report_json').notNull().default('{}'),
    actorSubject: text('actor_subject').notNull(),
    actorLabel: text('actor_label'),
    requestId: text('request_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    appliedAt: integer('applied_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('import_batches_preview_unique').on(table.previewId),
    uniqueIndex('import_batches_source_version_checksum_unique').on(
      table.sourceVersionId,
      table.contentChecksum,
    ),
    index('import_batches_source_idx').on(table.sourceId),
    index('import_batches_status_idx').on(table.status),
    index('import_batches_created_idx').on(table.createdAt),
  ],
);

export const contentConflicts = sqliteTable(
  'content_conflicts',
  {
    id: text('id').primaryKey().notNull(),
    entityType: text('entity_type').notNull(),
    entityKey: text('entity_key').notNull(),
    existingSourceId: text('existing_source_id').references(() => sources.id),
    existingSourceVersionId: text('existing_source_version_id').references(() => sourceVersions.id),
    incomingSourceId: text('incoming_source_id').references(() => sources.id),
    incomingSourceVersionId: text('incoming_source_version_id').references(() => sourceVersions.id),
    existingJson: text('existing_json').notNull(),
    incomingJson: text('incoming_json').notNull(),
    status: text('status', { enum: ['open', 'resolved', 'dismissed'] })
      .notNull()
      .default('open'),
    detectedAt: integer('detected_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
    resolvedBy: text('resolved_by'),
    resolutionNote: text('resolution_note'),
    importBatchId: text('import_batch_id').references(() => importBatches.id),
  },
  (table) => [
    uniqueIndex('content_conflicts_identity_unique').on(
      table.entityType,
      table.entityKey,
      table.existingSourceVersionId,
      table.incomingSourceVersionId,
    ),
    index('content_conflicts_entity_idx').on(table.entityType, table.entityKey),
    index('content_conflicts_status_idx').on(table.status),
    index('content_conflicts_detected_idx').on(table.detectedAt),
    index('content_conflicts_batch_idx').on(table.importBatchId),
  ],
);
