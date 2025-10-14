CREATE TABLE `analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`short_code` text NOT NULL,
	`timestamp` integer NOT NULL,
	`user_agent` text,
	`ip_address` text,
	FOREIGN KEY (`short_code`) REFERENCES `links`(`short_code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `links` ADD `created_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `links` ADD `visits_count` integer DEFAULT 0 NOT NULL;