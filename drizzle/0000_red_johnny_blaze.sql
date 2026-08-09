CREATE TABLE `catalog_audit_log` (
	`audit_id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`action` text NOT NULL,
	`previous_review_status` text,
	`next_review_status` text,
	`actor_id` text NOT NULL,
	`actor_email` text NOT NULL,
	`changes_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `catalog_audit_product_created_idx` ON `catalog_audit_log` (`product_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `catalog_sources` (
	`source_id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`catalog_family` text NOT NULL,
	`description` text,
	`page_count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`category_id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_uq` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `product_benefits` (
	`product_id` text NOT NULL,
	`position` integer NOT NULL,
	`benefit` text NOT NULL,
	PRIMARY KEY(`product_id`, `position`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_content` (
	`product_id` text PRIMARY KEY NOT NULL,
	`short_description` text NOT NULL,
	`description` text NOT NULL,
	`usage_instructions` text,
	`ingredients` text,
	`warnings` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_needs` (
	`product_id` text NOT NULL,
	`need_slug` text NOT NULL,
	PRIMARY KEY(`product_id`, `need_slug`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_needs_slug_idx` ON `product_needs` (`need_slug`);--> statement-breakpoint
CREATE TABLE `products` (
	`product_id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`lifecycle_status` text DEFAULT 'draft' NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`name` text NOT NULL,
	`brand` text NOT NULL,
	`category_id` text NOT NULL,
	`size_label` text,
	`size_extracted` text,
	`format_label` text,
	`price_cents` integer,
	`tax_rate` integer DEFAULT 21 NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`stock_quantity` integer,
	`maximum_units_per_order` integer DEFAULT 6 NOT NULL,
	`available_online` integer DEFAULT false NOT NULL,
	`requires_special_transport` integer DEFAULT false NOT NULL,
	`image_path` text,
	`ean` text,
	`source_id` text,
	`source_page` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `catalog_sources`(`source_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_uq` ON `products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_ean_uq` ON `products` (`ean`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_review_status_idx` ON `products` (`review_status`);--> statement-breakpoint
CREATE INDEX `products_source_idx` ON `products` (`source_id`);