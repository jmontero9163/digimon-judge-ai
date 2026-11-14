CREATE TABLE `card_images` (
	`id` text PRIMARY KEY NOT NULL
		DEFAULT (lower(hex(randomblob(16)))),
	`card_id` text NOT NULL
		REFERENCES `cards`(`id`) ON DELETE CASCADE,
	`url` text NOT NULL,
	`reference` text,
	`source_id` text
		REFERENCES `sources`(`id`),
	`type` text NOT NULL
		CHECK (`type` IN ('original','alternate','promotional','other')),
	`created_at` integer NOT NULL
		DEFAULT (unixepoch() * 1000)
);--> statement-breakpoint
CREATE INDEX `card_images_card_id_idx` ON `card_images`(`card_id`);
--> statement-breakpoint
CREATE INDEX `card_images_source_id_idx` ON `card_images`(`source_id`);