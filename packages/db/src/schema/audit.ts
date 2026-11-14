import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sources, sourceVersions } from './sources';
import { users } from './users';

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: text('id').primaryKey().notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    action: text('action', { enum: ['create', 'update', 'delete', 'import', 'publish'] }).notNull(),
    actorId: text('actor_id').references(() => users.id),
    actorSubject: text('actor_subject'),
    actorLabel: text('actor_label'),
    requestId: text('request_id'),
    sourceId: text('source_id').references(() => sources.id),
    sourceVersionId: text('source_version_id').references(() => sourceVersions.id),
    beforeJson: text('before_json'),
    afterJson: text('after_json'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_actor_idx').on(table.actorId),
    index('audit_log_source_version_idx').on(table.sourceVersionId),
    index('audit_log_request_idx').on(table.requestId),
    index('audit_log_created_idx').on(table.createdAt),
  ],
);

export const aiDrafts = sqliteTable(
  'ai_drafts',
  {
    id: text('id').primaryKey().notNull(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    citations: text('citations').notNull().default('[]'),
    status: text('status', { enum: ['generated', 'reviewed', 'rejected', 'superseded'] })
      .notNull()
      .default('generated'),
    reviewedBy: text('reviewed_by').references(() => users.id),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('ai_drafts_status_idx').on(table.status),
    index('ai_drafts_model_idx').on(table.model),
  ],
);
