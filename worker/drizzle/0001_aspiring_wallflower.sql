PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`user_agent` text,
	`ip_address` text,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_analytics`("id", "link_id", "timestamp", "user_agent", "ip_address") SELECT "id", "link_id", "timestamp", "user_agent", "ip_address" FROM `analytics`;--> statement-breakpoint
DROP TABLE `analytics`;--> statement-breakpoint
ALTER TABLE `__new_analytics` RENAME TO `analytics`;--> statement-breakpoint
PRAGMA foreign_keys=ON;