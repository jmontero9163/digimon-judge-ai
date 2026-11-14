CREATE TABLE `card_colors` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`color` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`source_version_id` text,
	`source_locator` text,
	`verified_by` text,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_colors_card_color_unique` ON `card_colors` (`card_id`,`color`);--> statement-breakpoint
CREATE INDEX `card_colors_color_idx` ON `card_colors` (`color`);--> statement-breakpoint
CREATE INDEX `card_colors_source_idx` ON `card_colors` (`source_id`);--> statement-breakpoint
CREATE INDEX `card_colors_source_version_idx` ON `card_colors` (`source_version_id`);--> statement-breakpoint
CREATE TABLE `card_printings` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`set_id` text,
	`printing_key` text NOT NULL,
	`rarity` text,
	`image_url` text,
	`variant` text,
	`release_date` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`source_version_id` text,
	`source_locator` text,
	`verified_by` text,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`set_id`) REFERENCES `card_sets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_printings_card_printing_key_unique` ON `card_printings` (`card_id`,`printing_key`);--> statement-breakpoint
CREATE INDEX `card_printings_set_idx` ON `card_printings` (`set_id`);--> statement-breakpoint
CREATE INDEX `card_printings_source_idx` ON `card_printings` (`source_id`);--> statement-breakpoint
CREATE INDEX `card_printings_source_version_idx` ON `card_printings` (`source_version_id`);--> statement-breakpoint
CREATE TABLE `card_traits` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`trait` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`source_version_id` text,
	`source_locator` text,
	`verified_by` text,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_traits_card_trait_unique` ON `card_traits` (`card_id`,`trait`);--> statement-breakpoint
CREATE INDEX `card_traits_trait_idx` ON `card_traits` (`trait`);--> statement-breakpoint
CREATE INDEX `card_traits_source_idx` ON `card_traits` (`source_id`);--> statement-breakpoint
CREATE INDEX `card_traits_source_version_idx` ON `card_traits` (`source_version_id`);--> statement-breakpoint
CREATE TABLE `content_conflicts` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_key` text NOT NULL,
	`existing_source_id` text,
	`existing_source_version_id` text,
	`incoming_source_id` text,
	`incoming_source_version_id` text,
	`existing_json` text NOT NULL,
	`incoming_json` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`detected_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`resolved_at` integer,
	`resolved_by` text,
	`resolution_note` text,
	`import_batch_id` text,
	FOREIGN KEY (`existing_source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`existing_source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`incoming_source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`incoming_source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`import_batch_id`) REFERENCES `import_batches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_conflicts_identity_unique` ON `content_conflicts` (`entity_type`,`entity_key`,`existing_source_version_id`,`incoming_source_version_id`);--> statement-breakpoint
CREATE INDEX `content_conflicts_entity_idx` ON `content_conflicts` (`entity_type`,`entity_key`);--> statement-breakpoint
CREATE INDEX `content_conflicts_status_idx` ON `content_conflicts` (`status`);--> statement-breakpoint
CREATE INDEX `content_conflicts_detected_idx` ON `content_conflicts` (`detected_at`);--> statement-breakpoint
CREATE INDEX `content_conflicts_batch_idx` ON `content_conflicts` (`import_batch_id`);--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`preview_id` text NOT NULL,
	`source_id` text,
	`source_version_id` text,
	`format` text NOT NULL,
	`content_checksum` text NOT NULL,
	`preview_hash` text NOT NULL,
	`status` text NOT NULL,
	`counts_json` text DEFAULT '{}' NOT NULL,
	`report_json` text DEFAULT '{}' NOT NULL,
	`actor_subject` text NOT NULL,
	`actor_label` text,
	`request_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`applied_at` integer,
	FOREIGN KEY (`preview_id`) REFERENCES `import_previews`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_batches_preview_unique` ON `import_batches` (`preview_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `import_batches_source_version_checksum_unique` ON `import_batches` (`source_version_id`,`content_checksum`);--> statement-breakpoint
CREATE INDEX `import_batches_source_idx` ON `import_batches` (`source_id`);--> statement-breakpoint
CREATE INDEX `import_batches_status_idx` ON `import_batches` (`status`);--> statement-breakpoint
CREATE INDEX `import_batches_created_idx` ON `import_batches` (`created_at`);--> statement-breakpoint
CREATE TABLE `import_previews` (
	`id` text PRIMARY KEY NOT NULL,
	`preview_hash` text NOT NULL,
	`content_checksum` text NOT NULL,
	`format` text NOT NULL,
	`entity` text NOT NULL,
	`source_stable_key` text,
	`source_version` text,
	`report_json` text DEFAULT '{}' NOT NULL,
	`actor_subject` text NOT NULL,
	`actor_label` text,
	`request_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`used_by_batch_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_previews_preview_hash_unique` ON `import_previews` (`preview_hash`);--> statement-breakpoint
CREATE INDEX `import_previews_source_idx` ON `import_previews` (`source_stable_key`,`source_version`);--> statement-breakpoint
CREATE INDEX `import_previews_expires_idx` ON `import_previews` (`expires_at`);--> statement-breakpoint
CREATE INDEX `import_previews_used_idx` ON `import_previews` (`used_at`);--> statement-breakpoint
CREATE TABLE `card_keywords` (
	`card_id` text NOT NULL,
	`keyword_id` text NOT NULL,
	`source_id` text NOT NULL,
	`source_version_id` text,
	`source_locator` text,
	`verified_by` text,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`card_id`, `keyword_id`),
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`keyword_id`) REFERENCES `keywords`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `card_keywords_keyword_idx` ON `card_keywords` (`keyword_id`);--> statement-breakpoint
CREATE INDEX `card_keywords_source_idx` ON `card_keywords` (`source_id`);--> statement-breakpoint
CREATE INDEX `card_keywords_source_version_idx` ON `card_keywords` (`source_version_id`);--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`stable_key` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`category` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`source_version_id` text,
	`source_locator` text,
	`verified_by` text,
	`verified_at` integer,
	`published_at` integer,
	`effective_from` integer,
	`supersedes_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supersedes_id`) REFERENCES `faqs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faqs_stable_key_version_unique` ON `faqs` (`stable_key`,`version`);--> statement-breakpoint
CREATE INDEX `faqs_category_idx` ON `faqs` (`category`);--> statement-breakpoint
CREATE INDEX `faqs_status_idx` ON `faqs` (`status`);--> statement-breakpoint
CREATE INDEX `faqs_source_idx` ON `faqs` (`source_id`);--> statement-breakpoint
CREATE INDEX `faqs_source_version_idx` ON `faqs` (`source_version_id`);--> statement-breakpoint
CREATE INDEX `faqs_supersedes_idx` ON `faqs` (`supersedes_id`);--> statement-breakpoint
CREATE TABLE `keyword_rules` (
	`keyword_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`source_id` text NOT NULL,
	`source_version_id` text,
	`source_locator` text,
	`verified_by` text,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`keyword_id`, `rule_id`),
	FOREIGN KEY (`keyword_id`) REFERENCES `keywords`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rule_id`) REFERENCES `rules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `keyword_rules_rule_idx` ON `keyword_rules` (`rule_id`);--> statement-breakpoint
CREATE INDEX `keyword_rules_source_idx` ON `keyword_rules` (`source_id`);--> statement-breakpoint
CREATE INDEX `keyword_rules_source_version_idx` ON `keyword_rules` (`source_version_id`);--> statement-breakpoint
CREATE TABLE `source_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`version` text NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`language` text,
	`published_at` integer,
	`retrieved_at` integer NOT NULL,
	`checksum` text NOT NULL,
	`verified_by` text,
	`verified_at` integer,
	`superseded_at` integer,
	`superseded_by_version_id` text,
	`change_note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`superseded_by_version_id`) REFERENCES `source_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_versions_source_version_unique` ON `source_versions` (`source_id`,`version`);--> statement-breakpoint
CREATE UNIQUE INDEX `source_versions_current_unique` ON `source_versions` (`source_id`) WHERE "source_versions"."superseded_at" is null;--> statement-breakpoint
CREATE INDEX `source_versions_source_published_idx` ON `source_versions` (`source_id`,`published_at`);--> statement-breakpoint
ALTER TABLE `audit_log` ADD `actor_subject` text;--> statement-breakpoint
ALTER TABLE `audit_log` ADD `actor_label` text;--> statement-breakpoint
ALTER TABLE `audit_log` ADD `request_id` text;--> statement-breakpoint
ALTER TABLE `audit_log` ADD `source_version_id` text REFERENCES source_versions(id);--> statement-breakpoint
CREATE INDEX `audit_log_source_version_idx` ON `audit_log` (`source_version_id`);--> statement-breakpoint
CREATE INDEX `audit_log_request_idx` ON `audit_log` (`request_id`);--> statement-breakpoint
ALTER TABLE `card_effects` ADD `stable_key` text;--> statement-breakpoint
ALTER TABLE `card_effects` ADD `source_version_id` text REFERENCES source_versions(id);--> statement-breakpoint
ALTER TABLE `card_effects` ADD `source_locator` text;--> statement-breakpoint
ALTER TABLE `card_effects` ADD `verified_by` text;--> statement-breakpoint
ALTER TABLE `card_effects` ADD `verified_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `card_effects_card_stable_key_unique` ON `card_effects` (`card_id`,`stable_key`);--> statement-breakpoint
CREATE INDEX `card_effects_source_version_idx` ON `card_effects` (`source_version_id`);--> statement-breakpoint
ALTER TABLE `card_sets` ADD `source_version_id` text REFERENCES source_versions(id);--> statement-breakpoint
ALTER TABLE `card_sets` ADD `source_locator` text;--> statement-breakpoint
ALTER TABLE `card_sets` ADD `verified_by` text;--> statement-breakpoint
ALTER TABLE `card_sets` ADD `verified_at` integer;--> statement-breakpoint
CREATE INDEX `card_sets_source_version_idx` ON `card_sets` (`source_version_id`);--> statement-breakpoint
ALTER TABLE `cards` ADD `source_version_id` text REFERENCES source_versions(id);--> statement-breakpoint
ALTER TABLE `cards` ADD `source_locator` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `verified_by` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `verified_at` integer;--> statement-breakpoint
CREATE INDEX `cards_source_version_idx` ON `cards` (`source_version_id`);--> statement-breakpoint
ALTER TABLE `erratas` ADD `stable_key` text;--> statement-breakpoint
ALTER TABLE `erratas` ADD `source_version_id` text REFERENCES source_versions(id);--> statement-breakpoint
ALTER TABLE `erratas` ADD `source_locator` text;--> statement-breakpoint
ALTER TABLE `erratas` ADD `verified_by` text;--> statement-breakpoint
ALTER TABLE `erratas` ADD `verified_at` integer;--> statement-breakpoint
ALTER TABLE `erratas` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `erratas` ADD `supersedes_id` text REFERENCES erratas(id);--> statement-breakpoint
CREATE UNIQUE INDEX `erratas_stable_key_unique` ON `erratas` (`stable_key`);--> statement-breakpoint
CREATE INDEX `erratas_source_version_idx` ON `erratas` (`source_version_id`);--> statement-breakpoint
CREATE INDEX `erratas_supersedes_idx` ON `erratas` (`supersedes_id`);--> statement-breakpoint
ALTER TABLE `keywords` ADD `source_version_id` text REFERENCES source_versions(id);--> statement-breakpoint
ALTER TABLE `keywords` ADD `source_locator` text;--> statement-breakpoint
ALTER TABLE `keywords` ADD `verified_by` text;--> statement-breakpoint
ALTER TABLE `keywords` ADD `verified_at` integer;--> statement-breakpoint
CREATE INDEX `keywords_source_version_idx` ON `keywords` (`source_version_id`);--> statement-breakpoint
ALTER TABLE `rules` ADD `source_version_id` text REFERENCES source_versions(id);--> statement-breakpoint
ALTER TABLE `rules` ADD `source_locator` text;--> statement-breakpoint
ALTER TABLE `rules` ADD `verified_by` text;--> statement-breakpoint
ALTER TABLE `rules` ADD `verified_at` integer;--> statement-breakpoint
ALTER TABLE `rules` ADD `supersedes_id` text REFERENCES rules(id);--> statement-breakpoint
CREATE INDEX `rules_source_version_idx` ON `rules` (`source_version_id`);--> statement-breakpoint
CREATE INDEX `rules_supersedes_idx` ON `rules` (`supersedes_id`);--> statement-breakpoint
ALTER TABLE `rulings` ADD `stable_key` text;--> statement-breakpoint
ALTER TABLE `rulings` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `rulings` ADD `source_version_id` text REFERENCES source_versions(id);--> statement-breakpoint
ALTER TABLE `rulings` ADD `source_locator` text;--> statement-breakpoint
ALTER TABLE `rulings` ADD `verified_by` text;--> statement-breakpoint
ALTER TABLE `rulings` ADD `verified_at` integer;--> statement-breakpoint
ALTER TABLE `rulings` ADD `effective_from` integer;--> statement-breakpoint
ALTER TABLE `rulings` ADD `supersedes_id` text REFERENCES rulings(id);--> statement-breakpoint
CREATE UNIQUE INDEX `rulings_stable_key_version_unique` ON `rulings` (`stable_key`,`version`);--> statement-breakpoint
CREATE INDEX `rulings_source_version_idx` ON `rulings` (`source_version_id`);--> statement-breakpoint
CREATE INDEX `rulings_supersedes_idx` ON `rulings` (`supersedes_id`);--> statement-breakpoint
ALTER TABLE `sources` ADD `stable_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `sources_stable_key_unique` ON `sources` (`stable_key`);