import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from './common';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().notNull(),
    email: text('email').notNull(),
    displayName: text('display_name'),
    role: text('role', { enum: ['admin', 'judge', 'user'] })
      .notNull()
      .default('user'),
    status: text('status', { enum: ['active', 'disabled'] })
      .notNull()
      .default('active'),
    accessSubject: text('access_subject'),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_access_subject_unique').on(table.accessSubject),
    index('users_role_idx').on(table.role),
    index('users_status_idx').on(table.status),
  ],
);
