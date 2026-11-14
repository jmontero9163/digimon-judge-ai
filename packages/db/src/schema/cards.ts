import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { ruleStatusColumn, timestampColumns } from './common';
import { sourceProvenanceColumns, sourceReferenceColumns } from './provenance';
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
    ...sourceProvenanceColumns(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('card_sets_code_unique').on(table.code),
    index('card_sets_source_idx').on(table.sourceId),
    index('card_sets_source_version_idx').on(table.sourceVersionId),
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
    ...sourceProvenanceColumns(),
    ...timestampColumns(),
  },
  (table) => [
    index('cards_name_idx').on(table.name),
    index('cards_set_idx').on(table.setId),
    index('cards_source_idx').on(table.sourceId),
    index('cards_source_version_idx').on(table.sourceVersionId),
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
    stableKey: text('stable_key'),
    kind: text('kind', { enum: ['main', 'inherited', 'security', 'alternate', 'other'] }).notNull(),
    officialText: text('official_text').notNull(),
    trigger: text('trigger'),
    condition: text('condition'),
    position: integer('position').notNull().default(0),
    status: ruleStatusColumn('status'),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    ...sourceProvenanceColumns(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('card_effects_card_stable_key_unique').on(table.cardId, table.stableKey),
    index('card_effects_card_idx').on(table.cardId),
    index('card_effects_kind_idx').on(table.kind),
    index('card_effects_source_idx').on(table.sourceId),
    index('card_effects_source_version_idx').on(table.sourceVersionId),
  ],
);

export const cardPrintings = sqliteTable(
  'card_printings',
  {
    id: text('id').primaryKey().notNull(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    setId: text('set_id').references(() => cardSets.id),
    printingKey: text('printing_key').notNull(),
    rarity: text('rarity'),
    imageUrl: text('image_url'),
    variant: text('variant'),
    releaseDate: integer('release_date', { mode: 'timestamp_ms' }),
    status: ruleStatusColumn('status'),
    ...sourceReferenceColumns(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('card_printings_card_printing_key_unique').on(table.cardId, table.printingKey),
    index('card_printings_set_idx').on(table.setId),
    index('card_printings_source_idx').on(table.sourceId),
    index('card_printings_source_version_idx').on(table.sourceVersionId),
  ],
);

export const cardColors = sqliteTable(
  'card_colors',
  {
    id: text('id').primaryKey().notNull(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    color: text('color').notNull(),
    position: integer('position').notNull().default(0),
    status: ruleStatusColumn('status'),
    ...sourceReferenceColumns(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('card_colors_card_color_unique').on(table.cardId, table.color),
    index('card_colors_color_idx').on(table.color),
    index('card_colors_source_idx').on(table.sourceId),
    index('card_colors_source_version_idx').on(table.sourceVersionId),
  ],
);

export const cardTraits = sqliteTable(
  'card_traits',
  {
    id: text('id').primaryKey().notNull(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    trait: text('trait').notNull(),
    position: integer('position').notNull().default(0),
    status: ruleStatusColumn('status'),
    ...sourceReferenceColumns(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('card_traits_card_trait_unique').on(table.cardId, table.trait),
    index('card_traits_trait_idx').on(table.trait),
    index('card_traits_source_idx').on(table.sourceId),
    index('card_traits_source_version_idx').on(table.sourceVersionId),
  ],
);
