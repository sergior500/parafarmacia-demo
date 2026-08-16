CREATE TABLE `admin_operation_log` (
	`audit_id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_operation_actor_created_idx` ON `admin_operation_log` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `admin_operation_action_created_idx` ON `admin_operation_log` (`action`,`created_at`);