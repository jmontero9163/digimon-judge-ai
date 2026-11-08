import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { RULE_STATUSES, SOURCE_KINDS } from '@digimon/domain';

export const timestampColumns = () => ({
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const ruleStatusColumn = (name = 'status') =>
  text(name, { enum: RULE_STATUSES }).notNull().default('pending');

export const sourceKindColumn = (name = 'kind') => text(name, { enum: SOURCE_KINDS }).notNull();
