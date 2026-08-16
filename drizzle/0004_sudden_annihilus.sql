ALTER TABLE `products` ADD `shopify_publication_status` text DEFAULT 'hidden' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_publication_error` text;--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_published_at` text;--> statement-breakpoint
CREATE INDEX `products_shopify_publication_status_idx` ON `products` (`shopify_publication_status`);
--> statement-breakpoint
UPDATE `products` SET `available_online` = 0;
