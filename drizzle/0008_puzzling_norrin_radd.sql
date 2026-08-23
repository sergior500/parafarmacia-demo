CREATE TABLE `customer_sessions` (
	`session_id_hash` text PRIMARY KEY NOT NULL,
	`access_token_ciphertext` text NOT NULL,
	`id_token_ciphertext` text NOT NULL,
	`refresh_token_ciphertext` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customer_sessions_expires_idx` ON `customer_sessions` (`expires_at`);