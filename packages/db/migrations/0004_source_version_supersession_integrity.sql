CREATE TRIGGER source_versions_supersession_match_insert
BEFORE INSERT ON source_versions
WHEN NEW.superseded_by_version_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM source_versions
    WHERE id = NEW.superseded_by_version_id AND source_id = NEW.source_id
  )
BEGIN
  SELECT RAISE(ABORT, 'superseded_by_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER source_versions_supersession_match_update
BEFORE UPDATE ON source_versions
WHEN NEW.superseded_by_version_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM source_versions
    WHERE id = NEW.superseded_by_version_id AND source_id = NEW.source_id
  )
BEGIN
  SELECT RAISE(ABORT, 'superseded_by_version_id does not belong to source_id');
END;
