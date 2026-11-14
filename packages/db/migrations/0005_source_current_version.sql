DROP TABLE IF EXISTS _migration_guard_current_versions;--> statement-breakpoint
CREATE TABLE _migration_guard_current_versions (
  source_id text NOT NULL,
  current_count integer NOT NULL
);--> statement-breakpoint
CREATE TRIGGER _migration_guard_current_versions_insert
BEFORE INSERT ON _migration_guard_current_versions
WHEN NEW.current_count > 1
BEGIN
  SELECT RAISE(ABORT, 'source_versions has multiple unsuperseded versions for one source');
END;--> statement-breakpoint
INSERT INTO _migration_guard_current_versions (source_id, current_count)
SELECT source_id, COUNT(*)
FROM source_versions
WHERE superseded_at IS NULL
GROUP BY source_id;--> statement-breakpoint
DROP TRIGGER _migration_guard_current_versions_insert;--> statement-breakpoint
DROP TABLE _migration_guard_current_versions;--> statement-breakpoint
DROP TABLE IF EXISTS _migration_guard_source_version_state;--> statement-breakpoint
CREATE TABLE _migration_guard_source_version_state (
  source_version_id text NOT NULL
);--> statement-breakpoint
CREATE TRIGGER _migration_guard_source_version_state_insert
BEFORE INSERT ON _migration_guard_source_version_state
BEGIN
  SELECT RAISE(ABORT, 'source_versions has inconsistent historical supersession state');
END;--> statement-breakpoint
INSERT INTO _migration_guard_source_version_state (source_version_id)
SELECT sv.id
FROM source_versions sv
WHERE (
    (sv.superseded_at IS NULL AND sv.superseded_by_version_id IS NOT NULL)
    OR (sv.superseded_at IS NOT NULL AND sv.superseded_by_version_id IS NULL)
  )
  OR sv.superseded_by_version_id = sv.id
  OR (
    sv.superseded_by_version_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM source_versions successor
      WHERE successor.id = sv.superseded_by_version_id
        AND successor.source_id = sv.source_id
    )
  )
LIMIT 1;--> statement-breakpoint
DROP TRIGGER _migration_guard_source_version_state_insert;--> statement-breakpoint
DROP TABLE _migration_guard_source_version_state;--> statement-breakpoint
ALTER TABLE sources ADD current_version_id text REFERENCES source_versions(id);--> statement-breakpoint
UPDATE sources
SET current_version_id = (
  SELECT sv.id
  FROM source_versions sv
  WHERE sv.source_id = sources.id
    AND sv.superseded_at IS NULL
)
WHERE (
  SELECT COUNT(*)
  FROM source_versions sv
  WHERE sv.source_id = sources.id
    AND sv.superseded_at IS NULL
) = 1;--> statement-breakpoint
ALTER TABLE source_versions ADD status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'current', 'superseded'));--> statement-breakpoint
UPDATE source_versions
SET status = CASE
  WHEN superseded_at IS NOT NULL THEN 'superseded'
  WHEN EXISTS (
    SELECT 1
    FROM sources s
    WHERE s.id = source_versions.source_id
      AND s.current_version_id = source_versions.id
  ) THEN 'current'
  ELSE 'pending'
END;--> statement-breakpoint
DROP TABLE IF EXISTS _migration_guard_pending_versions;--> statement-breakpoint
CREATE TABLE _migration_guard_pending_versions (
  source_version_id text NOT NULL
);--> statement-breakpoint
CREATE TRIGGER _migration_guard_pending_versions_insert
BEFORE INSERT ON _migration_guard_pending_versions
BEGIN
  SELECT RAISE(ABORT, 'pending source_versions remain after backfill');
END;--> statement-breakpoint
INSERT INTO _migration_guard_pending_versions (source_version_id)
SELECT id
FROM source_versions
WHERE status = 'pending'
LIMIT 1;--> statement-breakpoint
DROP TRIGGER _migration_guard_pending_versions_insert;--> statement-breakpoint
DROP TABLE _migration_guard_pending_versions;--> statement-breakpoint
DROP TABLE IF EXISTS _migration_guard_sources_current;--> statement-breakpoint
CREATE TABLE _migration_guard_sources_current (
  source_id text NOT NULL
);--> statement-breakpoint
CREATE TRIGGER _migration_guard_sources_current_insert
BEFORE INSERT ON _migration_guard_sources_current
BEGIN
  SELECT RAISE(ABORT, 'sources.current_version_id must reference a current source_version of the same source');
END;--> statement-breakpoint
INSERT INTO _migration_guard_sources_current (source_id)
SELECT s.id
FROM sources s
LEFT JOIN source_versions sv ON sv.id = s.current_version_id
WHERE s.current_version_id IS NOT NULL
  AND (
    sv.id IS NULL
    OR sv.source_id <> s.id
    OR sv.status <> 'current'
  )
LIMIT 1;--> statement-breakpoint
DROP TRIGGER _migration_guard_sources_current_insert;--> statement-breakpoint
DROP TABLE _migration_guard_sources_current;--> statement-breakpoint
CREATE UNIQUE INDEX source_versions_current_status_unique ON source_versions (source_id) WHERE status = 'current';--> statement-breakpoint
CREATE UNIQUE INDEX sources_current_version_unique ON sources (current_version_id);--> statement-breakpoint
DROP INDEX source_versions_current_unique;--> statement-breakpoint
CREATE TRIGGER source_versions_insert_pending_only
BEFORE INSERT ON source_versions
WHEN NEW.status <> 'pending'
  OR NEW.superseded_at IS NOT NULL
  OR NEW.superseded_by_version_id IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'new source_versions must be pending and unsuperseded');
END;--> statement-breakpoint
CREATE TRIGGER source_versions_no_delete
BEFORE DELETE ON source_versions
BEGIN
  SELECT RAISE(ABORT, 'source_versions cannot be deleted');
END;--> statement-breakpoint
CREATE TRIGGER source_versions_original_fields_immutable
BEFORE UPDATE ON source_versions
WHEN NEW.id IS NOT OLD.id
  OR NEW.source_id IS NOT OLD.source_id
  OR NEW.version IS NOT OLD.version
  OR NEW.title IS NOT OLD.title
  OR NEW.url IS NOT OLD.url
  OR NEW.language IS NOT OLD.language
  OR NEW.published_at IS NOT OLD.published_at
  OR NEW.retrieved_at IS NOT OLD.retrieved_at
  OR NEW.checksum IS NOT OLD.checksum
  OR NEW.verified_by IS NOT OLD.verified_by
  OR NEW.verified_at IS NOT OLD.verified_at
  OR NEW.change_note IS NOT OLD.change_note
  OR NEW.created_at IS NOT OLD.created_at
BEGIN
  SELECT RAISE(ABORT, 'source_versions original fields are immutable');
END;--> statement-breakpoint
CREATE TRIGGER source_versions_superseded_is_terminal
BEFORE UPDATE ON source_versions
WHEN OLD.status = 'superseded'
BEGIN
  SELECT RAISE(ABORT, 'superseded source_versions are immutable');
END;--> statement-breakpoint
CREATE TRIGGER source_versions_status_transition_allowed
BEFORE UPDATE OF status ON source_versions
WHEN NEW.status IS NOT OLD.status
  AND NOT (
    (OLD.status = 'pending' AND NEW.status = 'current')
    OR (OLD.status = 'current' AND NEW.status = 'superseded')
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid source_versions status transition');
END;--> statement-breakpoint
CREATE TRIGGER source_versions_state_fields_consistent
BEFORE UPDATE ON source_versions
WHEN NEW.status NOT IN ('pending', 'current', 'superseded')
  OR (
    NEW.status IN ('pending', 'current')
    AND (NEW.superseded_at IS NOT NULL OR NEW.superseded_by_version_id IS NOT NULL)
  )
  OR (
    NEW.status = 'superseded'
    AND (NEW.superseded_at IS NULL OR NEW.superseded_by_version_id IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'source_versions status and supersession fields are inconsistent');
END;--> statement-breakpoint
CREATE TRIGGER source_versions_no_self_supersession
BEFORE UPDATE ON source_versions
WHEN NEW.superseded_by_version_id IS NOT NULL
  AND NEW.superseded_by_version_id = NEW.id
BEGIN
  SELECT RAISE(ABORT, 'source_versions cannot supersede itself');
END;--> statement-breakpoint
CREATE TRIGGER source_versions_current_to_superseded_valid
BEFORE UPDATE OF status ON source_versions
WHEN OLD.status = 'current'
  AND NEW.status = 'superseded'
  AND (
    NEW.superseded_at IS NULL
    OR NEW.superseded_by_version_id IS NULL
    OR NEW.superseded_by_version_id = NEW.id
    OR NOT EXISTS (
      SELECT 1
      FROM sources s
      WHERE s.id = NEW.source_id
        AND s.current_version_id = OLD.id
    )
    OR NOT EXISTS (
      SELECT 1
      FROM source_versions successor
      WHERE successor.id = NEW.superseded_by_version_id
        AND successor.source_id = NEW.source_id
        AND successor.status = 'pending'
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid current -> superseded source_versions transition');
END;--> statement-breakpoint
CREATE TRIGGER source_versions_pending_to_current_valid
BEFORE UPDATE OF status ON source_versions
WHEN OLD.status = 'pending'
  AND NEW.status = 'current'
  AND (
    NEW.superseded_at IS NOT NULL
    OR NEW.superseded_by_version_id IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM source_versions other
      WHERE other.source_id = NEW.source_id
        AND other.status = 'current'
        AND other.id <> NEW.id
    )
    OR (
      EXISTS (
        SELECT 1
        FROM sources s
        WHERE s.id = NEW.source_id
          AND s.current_version_id IS NOT NULL
      )
      AND NOT EXISTS (
        SELECT 1
        FROM sources s
        JOIN source_versions old
          ON old.id = s.current_version_id
        WHERE s.id = NEW.source_id
          AND old.status = 'superseded'
          AND old.superseded_by_version_id = NEW.id
      )
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid pending -> current source_versions transition');
END;--> statement-breakpoint
CREATE TRIGGER sources_current_version_valid_insert
BEFORE INSERT ON sources
WHEN NEW.current_version_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM source_versions sv
    WHERE sv.id = NEW.current_version_id
      AND sv.source_id = NEW.id
      AND sv.status = 'current'
  )
BEGIN
  SELECT RAISE(ABORT, 'current_version_id must reference a current source_version of the same source');
END;--> statement-breakpoint
CREATE TRIGGER sources_current_version_valid_update
BEFORE UPDATE OF current_version_id ON sources
WHEN NEW.current_version_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM source_versions sv
    WHERE sv.id = NEW.current_version_id
      AND sv.source_id = NEW.id
      AND sv.status = 'current'
  )
BEGIN
  SELECT RAISE(ABORT, 'current_version_id must reference a current source_version of the same source');
END;--> statement-breakpoint
CREATE TRIGGER sources_current_version_no_clear_update
BEFORE UPDATE OF current_version_id ON sources
WHEN OLD.current_version_id IS NOT NULL
  AND NEW.current_version_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'sources.current_version_id cannot be cleared once assigned');
END;--> statement-breakpoint
CREATE TRIGGER sources_current_version_transition_consistent_update
BEFORE UPDATE OF current_version_id ON sources
WHEN NEW.current_version_id IS NOT NULL
  AND OLD.current_version_id IS NOT NULL
  AND NEW.current_version_id IS NOT OLD.current_version_id
  AND NOT EXISTS (
    SELECT 1
    FROM source_versions old
    WHERE old.id = OLD.current_version_id
      AND old.source_id = NEW.id
      AND old.status = 'superseded'
      AND old.superseded_by_version_id = NEW.current_version_id
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid sources.current_version_id transition');
END;
