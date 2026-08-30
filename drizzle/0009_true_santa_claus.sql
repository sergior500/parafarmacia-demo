CREATE TABLE `product_reviews` (
	`review_id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`customer_id_hash` text NOT NULL,
	`rating` integer NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`verified_purchase` integer DEFAULT true NOT NULL,
	`moderated_by` text,
	`moderated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_reviews_product_customer_uq` ON `product_reviews` (`product_id`,`customer_id_hash`);--> statement-breakpoint
CREATE INDEX `product_reviews_product_status_created_idx` ON `product_reviews` (`product_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `product_reviews_status_created_idx` ON `product_reviews` (`status`,`created_at`);