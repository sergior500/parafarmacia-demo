CREATE TABLE `shopify_webhook_receipts` (
	`webhook_id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`shop_domain` text NOT NULL,
	`resource_id` text,
	`status` text DEFAULT 'received' NOT NULL,
	`error` text,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`processed_at` text
);
--> statement-breakpoint
CREATE INDEX `shopify_webhook_topic_received_idx` ON `shopify_webhook_receipts` (`topic`,`received_at`);--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_product_id` text;--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_variant_id` text;--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_inventory_item_id` text;--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_sync_status` text DEFAULT 'not_synced' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_synced_at` text;--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_sync_error` text;--> statement-breakpoint
ALTER TABLE `products` ADD `shopify_payload_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `products_shopify_product_id_uq` ON `products` (`shopify_product_id`);--> statement-breakpoint
CREATE INDEX `products_shopify_sync_status_idx` ON `products` (`shopify_sync_status`);