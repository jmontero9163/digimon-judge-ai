CREATE TRIGGER audit_log_source_version_match_insert
BEFORE INSERT ON audit_log
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER audit_log_source_version_match_update
BEFORE UPDATE ON audit_log
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_colors_source_version_match_insert
BEFORE INSERT ON card_colors
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_colors_source_version_match_update
BEFORE UPDATE ON card_colors
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_effects_source_version_match_insert
BEFORE INSERT ON card_effects
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_effects_source_version_match_update
BEFORE UPDATE ON card_effects
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_keywords_source_version_match_insert
BEFORE INSERT ON card_keywords
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_keywords_source_version_match_update
BEFORE UPDATE ON card_keywords
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_printings_source_version_match_insert
BEFORE INSERT ON card_printings
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_printings_source_version_match_update
BEFORE UPDATE ON card_printings
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_sets_source_version_match_insert
BEFORE INSERT ON card_sets
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_sets_source_version_match_update
BEFORE UPDATE ON card_sets
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_traits_source_version_match_insert
BEFORE INSERT ON card_traits
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER card_traits_source_version_match_update
BEFORE UPDATE ON card_traits
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER cards_source_version_match_insert
BEFORE INSERT ON cards
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER cards_source_version_match_update
BEFORE UPDATE ON cards
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER erratas_source_version_match_insert
BEFORE INSERT ON erratas
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER erratas_source_version_match_update
BEFORE UPDATE ON erratas
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER faqs_source_version_match_insert
BEFORE INSERT ON faqs
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER faqs_source_version_match_update
BEFORE UPDATE ON faqs
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER import_batches_source_version_match_insert
BEFORE INSERT ON import_batches
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER import_batches_source_version_match_update
BEFORE UPDATE ON import_batches
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER keyword_rules_source_version_match_insert
BEFORE INSERT ON keyword_rules
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER keyword_rules_source_version_match_update
BEFORE UPDATE ON keyword_rules
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER keywords_source_version_match_insert
BEFORE INSERT ON keywords
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER keywords_source_version_match_update
BEFORE UPDATE ON keywords
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER rules_source_version_match_insert
BEFORE INSERT ON rules
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER rules_source_version_match_update
BEFORE UPDATE ON rules
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER rulings_source_version_match_insert
BEFORE INSERT ON rulings
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER rulings_source_version_match_update
BEFORE UPDATE ON rulings
WHEN NEW.source_version_id IS NOT NULL
  AND (
    NEW.source_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM source_versions
      WHERE id = NEW.source_version_id AND source_id = NEW.source_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER content_conflicts_source_version_match_insert
BEFORE INSERT ON content_conflicts
WHEN (
    NEW.existing_source_version_id IS NOT NULL
    AND (
      NEW.existing_source_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM source_versions
        WHERE id = NEW.existing_source_version_id AND source_id = NEW.existing_source_id
      )
    )
  )
  OR (
    NEW.incoming_source_version_id IS NOT NULL
    AND (
      NEW.incoming_source_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM source_versions
        WHERE id = NEW.incoming_source_version_id AND source_id = NEW.incoming_source_id
      )
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
--> statement-breakpoint
CREATE TRIGGER content_conflicts_source_version_match_update
BEFORE UPDATE ON content_conflicts
WHEN (
    NEW.existing_source_version_id IS NOT NULL
    AND (
      NEW.existing_source_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM source_versions
        WHERE id = NEW.existing_source_version_id AND source_id = NEW.existing_source_id
      )
    )
  )
  OR (
    NEW.incoming_source_version_id IS NOT NULL
    AND (
      NEW.incoming_source_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM source_versions
        WHERE id = NEW.incoming_source_version_id AND source_id = NEW.incoming_source_id
      )
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'source_version_id does not belong to source_id');
END;
