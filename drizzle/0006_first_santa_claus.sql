CREATE TABLE `admin_users` (
	`email` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_user_id_uq` ON `admin_users` (`user_id`);--> statement-breakpoint
CREATE INDEX `admin_users_enabled_role_idx` ON `admin_users` (`enabled`,`role`);--> statement-breakpoint
PRAGMA optimize;
