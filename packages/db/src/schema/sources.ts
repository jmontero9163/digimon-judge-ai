import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sourceKindColumn, timestampColumns } from './common';

export const sources = sqliteTable(
  'sources',
  {
    id: text('id').primaryKey().notNull(),
    kind: sourceKindColumn('kind'),
    name: text('name').notNull(),
    publisher: text('publisher'),
    url: text('url'),
    official: integer('official', { mode: 'boolean' }).notNull().default(false),
    checksum: text('checksum'),
    retrievedAt: integer('retrieved_at', { mode: 'timestamp_ms' }),
    notes: text('notes'),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('sources_url_unique').on(table.url),
    index('sources_kind_idx').on(table.kind),
    index('sources_official_idx').on(table.official),
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
