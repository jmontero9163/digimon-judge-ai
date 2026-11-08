CREATE TABLE `ai_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`citations` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'generated' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ai_drafts_status_idx` ON `ai_drafts` (`status`);--> statement-breakpoint
CREATE INDEX `ai_drafts_model_idx` ON `ai_drafts` (`model`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`actor_id` text,
	`source_id` text,
	`before_json` text,
	`after_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_log_entity_idx` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_log_actor_idx` ON `audit_log` (`actor_id`);--> statement-breakpoint
CREATE INDEX `audit_log_created_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `card_effects` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`kind` text NOT NULL,
	`official_text` text NOT NULL,
	`trigger` text,
	`condition` text,
	`position` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `card_effects_card_idx` ON `card_effects` (`card_id`);--> statement-breakpoint
CREATE INDEX `card_effects_kind_idx` ON `card_effects` (`kind`);--> statement-breakpoint
CREATE INDEX `card_effects_source_idx` ON `card_effects` (`source_id`);--> statement-breakpoint
CREATE TABLE `card_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`release_date` integer,
	`source_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_sets_code_unique` ON `card_sets` (`code`);--> statement-breakpoint
CREATE INDEX `card_sets_source_idx` ON `card_sets` (`source_id`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_en` text,
	`name_ja` text,
	`set_id` text,
	`card_type` text,
	`color` text,
	`level` integer,
	`dp` integer,
	`play_cost` integer,
	`evolution_cost` integer,
	`form` text,
	`attribute` text,
	`rarity` text,
	`image_url` text,
	`official_text` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`set_id`) REFERENCES `card_sets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cards_name_idx` ON `cards` (`name`);--> statement-breakpoint
CREATE INDEX `cards_set_idx` ON `cards` (`set_id`);--> statement-breakpoint
CREATE INDEX `cards_source_idx` ON `cards` (`source_id`);--> statement-breakpoint
CREATE INDEX `cards_status_idx` ON `cards` (`status`);--> statement-breakpoint
CREATE TABLE `deck_cards` (
	`deck_id` text NOT NULL,
	`card_id` text NOT NULL,
	`section` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`deck_id`, `card_id`, `section`),
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `deck_cards_card_idx` ON `deck_cards` (`card_id`);--> statement-breakpoint
CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`name` text NOT NULL,
	`format` text,
	`visibility` text DEFAULT 'private' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `decks_owner_idx` ON `decks` (`owner_id`);--> statement-breakpoint
CREATE INDEX `decks_visibility_idx` ON `decks` (`visibility`);--> statement-breakpoint
CREATE TABLE `erratas` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`field` text NOT NULL,
	`previous_value` text,
	`new_value` text NOT NULL,
	`reason` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`effective_from` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `erratas_card_idx` ON `erratas` (`card_id`);--> statement-breakpoint
CREATE INDEX `erratas_source_idx` ON `erratas` (`source_id`);--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`question` text NOT NULL,
	`resolution` text NOT NULL,
	`card_ids` text DEFAULT '[]' NOT NULL,
	`keyword_ids` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `interactions_status_idx` ON `interactions` (`status`);--> statement-breakpoint
CREATE INDEX `interactions_source_idx` ON `interactions` (`source_id`);--> statement-breakpoint
CREATE TABLE `keywords` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`aliases` text DEFAULT '[]' NOT NULL,
	`definition` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `keywords_name_unique` ON `keywords` (`name`);--> statement-breakpoint
CREATE INDEX `keywords_source_idx` ON `keywords` (`source_id`);--> statement-breakpoint
CREATE TABLE `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`stable_key` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`category` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`effective_from` integer,
	`supersedes_key` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rules_stable_key_version_unique` ON `rules` (`stable_key`,`version`);--> statement-breakpoint
CREATE INDEX `rules_status_idx` ON `rules` (`status`);--> statement-breakpoint
CREATE INDEX `rules_source_idx` ON `rules` (`source_id`);--> statement-breakpoint
CREATE INDEX `rules_category_idx` ON `rules` (`category`);--> statement-breakpoint
CREATE TABLE `rulings` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text,
	`rule_id` text,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_id` text NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rule_id`) REFERENCES `rules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rulings_card_idx` ON `rulings` (`card_id`);--> statement-breakpoint
CREATE INDEX `rulings_rule_idx` ON `rulings` (`rule_id`);--> statement-breakpoint
CREATE INDEX `rulings_source_idx` ON `rulings` (`source_id`);--> statement-breakpoint
CREATE INDEX `rulings_status_idx` ON `rulings` (`status`);--> statement-breakpoint
CREATE TABLE `source_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`alias` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_aliases_alias_unique` ON `source_aliases` (`alias`);--> statement-breakpoint
CREATE INDEX `source_aliases_source_idx` ON `source_aliases` (`source_id`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`publisher` text,
	`url` text,
	`official` integer DEFAULT false NOT NULL,
	`checksum` text,
	`retrieved_at` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sources_url_unique` ON `sources` (`url`);--> statement-breakpoint
CREATE INDEX `sources_kind_idx` ON `sources` (`kind`);--> statement-breakpoint
CREATE INDEX `sources_official_idx` ON `sources` (`official`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`access_subject` text,
	`last_seen_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_access_subject_unique` ON `users` (`access_subject`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);