CREATE TABLE `production_readiness_checks` (
	`check_id` text PRIMARY KEY NOT NULL,
	`ready` integer DEFAULT false NOT NULL,
	`verified_by` text,
	`verified_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
