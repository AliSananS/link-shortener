PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_links` (
	`short_code` text NOT NULL,
	`user_id` text,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`visits_count` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_links`("short_code", "user_id", "expires_at", "created_at", "visits_count") SELECT "short_code", "user_id", "expires_at", "created_at", "visits_count" FROM `links`;--> statement-breakpoint
DROP TABLE `links`;--> statement-breakpoint
ALTER TABLE `__new_links` RENAME TO `links`;--> statement-breakpoint
PRAGMA foreign_keys=ON;