import { sql } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { cards } from './cards';
import { ruleStatusColumn, timestampColumns } from './common';
import { sourceProvenanceColumns, sourceReferenceColumns } from './provenance';
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
    ...sourceProvenanceColumns(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('keywords_name_unique').on(table.name),
    index('keywords_source_idx').on(table.sourceId),
    index('keywords_source_version_idx').on(table.sourceVersionId),
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
    ...sourceProvenanceColumns(),
    effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }),
    supersedesKey: text('supersedes_key'),
    supersedesId: text('supersedes_id').references((): AnySQLiteColumn => rules.id),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('rules_stable_key_version_unique').on(table.stableKey, table.version),
    index('rules_status_idx').on(table.status),
    index('rules_source_idx').on(table.sourceId),
    index('rules_source_version_idx').on(table.sourceVersionId),
    index('rules_supersedes_idx').on(table.supersedesId),
    index('rules_category_idx').on(table.category),
  ],
);

export const rulings = sqliteTable(
  'rulings',
  {
    id: text('id').primaryKey().notNull(),
    stableKey: text('stable_key'),
    version: integer('version').notNull().default(1),
    cardId: text('card_id').references(() => cards.id),
    ruleId: text('rule_id').references(() => rules.id),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    ...sourceProvenanceColumns(),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }),
    supersedesId: text('supersedes_id').references((): AnySQLiteColumn => rulings.id),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('rulings_stable_key_version_unique').on(table.stableKey, table.version),
    index('rulings_card_idx').on(table.cardId),
    index('rulings_rule_idx').on(table.ruleId),
    index('rulings_source_idx').on(table.sourceId),
    index('rulings_source_version_idx').on(table.sourceVersionId),
    index('rulings_supersedes_idx').on(table.supersedesId),
    index('rulings_status_idx').on(table.status),
  ],
);

export const erratas = sqliteTable(
  'erratas',
  {
    id: text('id').primaryKey().notNull(),
    stableKey: text('stable_key'),
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
    ...sourceProvenanceColumns(),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }),
    supersedesId: text('supersedes_id').references((): AnySQLiteColumn => erratas.id),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('erratas_stable_key_unique').on(table.stableKey),
    index('erratas_card_idx').on(table.cardId),
    index('erratas_source_idx').on(table.sourceId),
    index('erratas_source_version_idx').on(table.sourceVersionId),
    index('erratas_supersedes_idx').on(table.supersedesId),
  ],
);

export const faqs = sqliteTable(
  'faqs',
  {
    id: text('id').primaryKey().notNull(),
    stableKey: text('stable_key').notNull(),
    version: integer('version').notNull().default(1),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    category: text('category'),
    status: ruleStatusColumn('status'),
    ...sourceReferenceColumns(),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }),
    supersedesId: text('supersedes_id').references((): AnySQLiteColumn => faqs.id),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('faqs_stable_key_version_unique').on(table.stableKey, table.version),
    index('faqs_category_idx').on(table.category),
    index('faqs_status_idx').on(table.status),
    index('faqs_source_idx').on(table.sourceId),
    index('faqs_source_version_idx').on(table.sourceVersionId),
    index('faqs_supersedes_idx').on(table.supersedesId),
  ],
);

export const keywordRules = sqliteTable(
  'keyword_rules',
  {
    keywordId: text('keyword_id')
      .notNull()
      .references(() => keywords.id),
    ruleId: text('rule_id')
      .notNull()
      .references(() => rules.id),
    ...sourceReferenceColumns(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    primaryKey({ columns: [table.keywordId, table.ruleId] }),
    index('keyword_rules_rule_idx').on(table.ruleId),
    index('keyword_rules_source_idx').on(table.sourceId),
    index('keyword_rules_source_version_idx').on(table.sourceVersionId),
  ],
);

export const cardKeywords = sqliteTable(
  'card_keywords',
  {
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    keywordId: text('keyword_id')
      .notNull()
      .references(() => keywords.id),
    ...sourceReferenceColumns(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.keywordId] }),
    index('card_keywords_keyword_idx').on(table.keywordId),
    index('card_keywords_source_idx').on(table.sourceId),
    index('card_keywords_source_version_idx').on(table.sourceVersionId),
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
