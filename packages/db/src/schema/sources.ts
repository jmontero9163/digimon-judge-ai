import { SOURCE_VERSION_STATUSES } from '@digimon/domain';
import { sql } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sourceKindColumn, timestampColumns } from './common';

export const sources = sqliteTable(
  'sources',
  {
    id: text('id').primaryKey().notNull(),
    stableKey: text('stable_key'),
    kind: sourceKindColumn('kind'),
    name: text('name').notNull(),
    publisher: text('publisher'),
    url: text('url'),
    official: integer('official', { mode: 'boolean' }).notNull().default(false),
    checksum: text('checksum'),
    retrievedAt: integer('retrieved_at', { mode: 'timestamp_ms' }),
    notes: text('notes'),
    currentVersionId: text('current_version_id').references(
      (): AnySQLiteColumn => sourceVersions.id,
    ),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('sources_stable_key_unique').on(table.stableKey),
    uniqueIndex('sources_url_unique').on(table.url),
    uniqueIndex('sources_current_version_unique').on(table.currentVersionId),
    index('sources_kind_idx').on(table.kind),
    index('sources_official_idx').on(table.official),
  ],
);

export const sourceVersions = sqliteTable(
  'source_versions',
  {
    id: text('id').primaryKey().notNull(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    version: text('version').notNull(),
    status: text('status', { enum: SOURCE_VERSION_STATUSES }).notNull().default('pending'),
    title: text('title').notNull(),
    url: text('url'),
    language: text('language'),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    retrievedAt: integer('retrieved_at', { mode: 'timestamp_ms' }).notNull(),
    checksum: text('checksum').notNull(),
    verifiedBy: text('verified_by'),
    verifiedAt: integer('verified_at', { mode: 'timestamp_ms' }),
    supersededAt: integer('superseded_at', { mode: 'timestamp_ms' }),
    supersededByVersionId: text('superseded_by_version_id').references(
      (): AnySQLiteColumn => sourceVersions.id,
    ),
    changeNote: text('change_note'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('source_versions_source_version_unique').on(table.sourceId, table.version),
    uniqueIndex('source_versions_current_status_unique')
      .on(table.sourceId)
      .where(sql`${table.status} = 'current'`),
    index('source_versions_source_published_idx').on(table.sourceId, table.publishedAt),
  ],
);

export const sourceAliases = sqliteTable(
  'source_aliases',
  {
    id: text('id').primaryKey().notNull(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    alias: text('alias').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('source_aliases_alias_unique').on(table.alias),
    index('source_aliases_source_idx').on(table.sourceId),
  ],
);
