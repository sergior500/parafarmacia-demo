ALTER TABLE `admin_users` ADD `shopify_user_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_shopify_user_id_uq` ON `admin_users` (`shopify_user_id`);