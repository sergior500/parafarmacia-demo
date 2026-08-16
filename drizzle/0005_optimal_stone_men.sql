CREATE TABLE `admin_rate_limits` (
	`rate_key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_rate_limits_reset_idx` ON `admin_rate_limits` (`reset_at`);--> statement-breakpoint
CREATE TABLE `security_event_log` (
	`event_id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`actor_id` text,
	`actor_email` text,
	`actor_role` text,
	`event_type` text NOT NULL,
	`outcome` text NOT NULL,
	`method` text NOT NULL,
	`route` text NOT NULL,
	`network_fingerprint` text,
	`user_agent_fingerprint` text,
	`detail` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `security_event_created_idx` ON `security_event_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `security_event_actor_created_idx` ON `security_event_log` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `security_event_type_created_idx` ON `security_event_log` (`event_type`,`created_at`);