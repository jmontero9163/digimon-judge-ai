import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { ruleStatusColumn, timestampColumns } from './common';
import { sources } from './sources';

export const cardSets = sqliteTable(
  'card_sets',
  {
    id: text('id').primaryKey().notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    releaseDate: integer('release_date', { mode: 'timestamp_ms' }),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('card_sets_code_unique').on(table.code),
    index('card_sets_source_idx').on(table.sourceId),
  ],
);

export const cards = sqliteTable(
  'cards',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    nameEn: text('name_en'),
    nameJa: text('name_ja'),
    setId: text('set_id').references(() => cardSets.id),
    cardType: text('card_type'),
    color: text('color'),
    level: integer('level'),
    dp: integer('dp'),
    playCost: integer('play_cost'),
    evolutionCost: integer('evolution_cost'),
    form: text('form'),
    attribute: text('attribute'),
    rarity: text('rarity'),
    imageUrl: text('image_url'),
    officialText: text('official_text'),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    ...timestampColumns(),
  },
  (table) => [
    index('cards_name_idx').on(table.name),
    index('cards_set_idx').on(table.setId),
    index('cards_source_idx').on(table.sourceId),
    index('cards_status_idx').on(table.status),
  ],
);

export const cardEffects = sqliteTable(
  'card_effects',
  {
    id: text('id').primaryKey().notNull(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    kind: text('kind', { enum: ['main', 'inherited', 'security', 'alternate', 'other'] }).notNull(),
    officialText: text('official_text').notNull(),
    trigger: text('trigger'),
    condition: text('condition'),
    position: integer('position').notNull().default(0),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    ...timestampColumns(),
  },
  (table) => [
    index('card_effects_card_idx').on(table.cardId),
    index('card_effects_kind_idx').on(table.kind),
    index('card_effects_source_idx').on(table.sourceId),
  ],
);
