import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { cards } from './cards';
import { timestampColumns } from './common';
import { users } from './users';

export const decks = sqliteTable(
  'decks',
  {
    id: text('id').primaryKey().notNull(),
    ownerId: text('owner_id').references(() => users.id),
    name: text('name').notNull(),
    format: text('format'),
    visibility: text('visibility', { enum: ['private', 'unlisted', 'public'] })
      .notNull()
      .default('private'),
    notes: text('notes'),
    ...timestampColumns(),
  },
  (table) => [
    index('decks_owner_idx').on(table.ownerId),
    index('decks_visibility_idx').on(table.visibility),
  ],
);

export const deckCards = sqliteTable(
  'deck_cards',
  {
    deckId: text('deck_id')
      .notNull()
      .references(() => decks.id),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    section: text('section', { enum: ['main', 'egg'] }).notNull(),
    count: integer('count').notNull().default(1),
  },
  (table) => [
    primaryKey({ columns: [table.deckId, table.cardId, table.section] }),
    index('deck_cards_card_idx').on(table.cardId),
  ],
);
