import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { cards } from './cards';
import { ruleStatusColumn, timestampColumns } from './common';
import { sources } from './sources';

export const keywords = sqliteTable(
  'keywords',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    aliases: text('aliases').notNull().default('[]'),
    definition: text('definition').notNull(),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('keywords_name_unique').on(table.name),
    index('keywords_source_idx').on(table.sourceId),
  ],
);

export const rules = sqliteTable(
  'rules',
  {
    id: text('id').primaryKey().notNull(),
    stableKey: text('stable_key').notNull(),
    version: integer('version').notNull().default(1),
    title: text('title').notNull(),
    body: text('body').notNull(),
    category: text('category'),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }),
    supersedesKey: text('supersedes_key'),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('rules_stable_key_version_unique').on(table.stableKey, table.version),
    index('rules_status_idx').on(table.status),
    index('rules_source_idx').on(table.sourceId),
    index('rules_category_idx').on(table.category),
  ],
);

export const rulings = sqliteTable(
  'rulings',
  {
    id: text('id').primaryKey().notNull(),
    cardId: text('card_id').references(() => cards.id),
    ruleId: text('rule_id').references(() => rules.id),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    ...timestampColumns(),
  },
  (table) => [
    index('rulings_card_idx').on(table.cardId),
    index('rulings_rule_idx').on(table.ruleId),
    index('rulings_source_idx').on(table.sourceId),
    index('rulings_status_idx').on(table.status),
  ],
);

export const erratas = sqliteTable(
  'erratas',
  {
    id: text('id').primaryKey().notNull(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    field: text('field').notNull(),
    previousValue: text('previous_value'),
    newValue: text('new_value').notNull(),
    reason: text('reason'),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }),
    ...timestampColumns(),
  },
  (table) => [
    index('erratas_card_idx').on(table.cardId),
    index('erratas_source_idx').on(table.sourceId),
  ],
);

export const interactions = sqliteTable(
  'interactions',
  {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    question: text('question').notNull(),
    resolution: text('resolution').notNull(),
    cardIds: text('card_ids').notNull().default('[]'),
    keywordIds: text('keyword_ids').notNull().default('[]'),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    verifiedAt: integer('verified_at', { mode: 'timestamp_ms' }),
    ...timestampColumns(),
  },
  (table) => [
    index('interactions_status_idx').on(table.status),
    index('interactions_source_idx').on(table.sourceId),
  ],
);
