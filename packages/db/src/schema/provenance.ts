import { integer, text } from 'drizzle-orm/sqlite-core';
import { sources, sourceVersions } from './sources';

export function sourceProvenanceColumns() {
  return {
    sourceVersionId: text('source_version_id').references(() => sourceVersions.id),
    sourceLocator: text('source_locator'),
    verifiedBy: text('verified_by'),
    verifiedAt: integer('verified_at', { mode: 'timestamp_ms' }),
  };
}

export function sourceReferenceColumns() {
  return {
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    ...sourceProvenanceColumns(),
  };
}
