import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const catalogSources = sqliteTable("catalog_sources", {
  sourceId: text("source_id").primaryKey(),
  fileName: text("file_name").notNull(),
  catalogFamily: text("catalog_family").notNull(),
  description: text("description"),
  pageCount: integer("page_count").notNull(),
});

export const categories = sqliteTable(
  "categories",
  {
    categoryId: text("category_id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
  },
  (table) => [uniqueIndex("categories_slug_uq").on(table.slug)],
);

export const products = sqliteTable(
  "products",
  {
    productId: text("product_id").primaryKey(),
    slug: text("slug").notNull(),
    lifecycleStatus: text("lifecycle_status").notNull().default("draft"),
    reviewStatus: text("review_status").notNull().default("pending"),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.categoryId),
    sizeLabel: text("size_label"),
    sizeExtracted: text("size_extracted"),
    formatLabel: text("format_label"),
    priceCents: integer("price_cents"),
    taxRate: integer("tax_rate").notNull().default(21),
    currency: text("currency").notNull().default("EUR"),
    stockQuantity: integer("stock_quantity"),
    maximumUnitsPerOrder: integer("maximum_units_per_order")
      .notNull()
      .default(6),
    availableOnline: integer("available_online", { mode: "boolean" })
      .notNull()
      .default(false),
    requiresSpecialTransport: integer("requires_special_transport", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    imagePath: text("image_path"),
    ean: text("ean"),
    shopifyProductId: text("shopify_product_id"),
    shopifyVariantId: text("shopify_variant_id"),
    shopifyInventoryItemId: text("shopify_inventory_item_id"),
    shopifySyncStatus: text("shopify_sync_status")
      .notNull()
      .default("not_synced"),
    shopifySyncedAt: text("shopify_synced_at"),
    shopifySyncError: text("shopify_sync_error"),
    shopifyPayloadHash: text("shopify_payload_hash"),
    shopifyPublicationStatus: text("shopify_publication_status")
      .notNull()
      .default("hidden"),
    shopifyPublicationError: text("shopify_publication_error"),
    shopifyPublishedAt: text("shopify_published_at"),
    sourceId: text("source_id").references(() => catalogSources.sourceId),
    sourcePage: integer("source_page"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("products_slug_uq").on(table.slug),
    uniqueIndex("products_ean_uq").on(table.ean),
    uniqueIndex("products_shopify_product_id_uq").on(table.shopifyProductId),
    index("products_category_idx").on(table.categoryId),
    index("products_review_status_idx").on(table.reviewStatus),
    index("products_source_idx").on(table.sourceId),
    index("products_shopify_sync_status_idx").on(table.shopifySyncStatus),
    index("products_shopify_publication_status_idx").on(
      table.shopifyPublicationStatus,
    ),
  ],
);

export const shopifyWebhookReceipts = sqliteTable(
  "shopify_webhook_receipts",
  {
    webhookId: text("webhook_id").primaryKey(),
    topic: text("topic").notNull(),
    shopDomain: text("shop_domain").notNull(),
    resourceId: text("resource_id"),
    status: text("status").notNull().default("received"),
    error: text("error"),
    receivedAt: text("received_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    processedAt: text("processed_at"),
  },
  (table) => [
    index("shopify_webhook_topic_received_idx").on(
      table.topic,
      table.receivedAt,
    ),
  ],
);

export const productContent = sqliteTable("product_content", {
  productId: text("product_id")
    .primaryKey()
    .references(() => products.productId, { onDelete: "cascade" }),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  usageInstructions: text("usage_instructions"),
  ingredients: text("ingredients"),
  warnings: text("warnings"),
});

export const productBenefits = sqliteTable(
  "product_benefits",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.productId, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    benefit: text("benefit").notNull(),
  },
  (table) => [primaryKey({ columns: [table.productId, table.position] })],
);

export const productNeeds = sqliteTable(
  "product_needs",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.productId, { onDelete: "cascade" }),
    needSlug: text("need_slug").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.needSlug] }),
    index("product_needs_slug_idx").on(table.needSlug),
  ],
);

export const catalogAuditLog = sqliteTable(
  "catalog_audit_log",
  {
    auditId: text("audit_id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.productId, { onDelete: "cascade" }),
    action: text("action").notNull(),
    previousReviewStatus: text("previous_review_status"),
    nextReviewStatus: text("next_review_status"),
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email").notNull(),
    changesJson: text("changes_json").notNull().default("{}"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("catalog_audit_product_created_idx").on(
      table.productId,
      table.createdAt,
    ),
  ],
);

export const adminOperationLog = sqliteTable(
  "admin_operation_log",
  {
    auditId: text("audit_id").primaryKey(),
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("admin_operation_actor_created_idx").on(
      table.actorId,
      table.createdAt,
    ),
    index("admin_operation_action_created_idx").on(
      table.action,
      table.createdAt,
    ),
  ],
);

export const adminUsers = sqliteTable(
  "admin_users",
  {
    email: text("email").primaryKey(),
    // Temporary Sites/ChatGPT identity. Kept separate so the production
    // Shopify identity can be linked and verified before the cut-over.
    userId: text("user_id"),
    shopifyUserId: text("shopify_user_id"),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("admin_users_user_id_uq").on(table.userId),
    uniqueIndex("admin_users_shopify_user_id_uq").on(table.shopifyUserId),
    index("admin_users_enabled_role_idx").on(table.enabled, table.role),
  ],
);

export const customerSessions = sqliteTable(
  "customer_sessions",
  {
    sessionIdHash: text("session_id_hash").primaryKey(),
    accessTokenCiphertext: text("access_token_ciphertext").notNull(),
    idTokenCiphertext: text("id_token_ciphertext").notNull(),
    refreshTokenCiphertext: text("refresh_token_ciphertext"),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
  },
  (table) => [index("customer_sessions_expires_idx").on(table.expiresAt)],
);

export const adminRateLimits = sqliteTable(
  "admin_rate_limits",
  {
    rateKey: text("rate_key").primaryKey(),
    count: integer("count").notNull(),
    resetAt: integer("reset_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("admin_rate_limits_reset_idx").on(table.resetAt)],
);

export const securityEventLog = sqliteTable(
  "security_event_log",
  {
    eventId: text("event_id").primaryKey(),
    requestId: text("request_id").notNull(),
    actorId: text("actor_id"),
    actorEmail: text("actor_email"),
    actorRole: text("actor_role"),
    eventType: text("event_type").notNull(),
    outcome: text("outcome").notNull(),
    method: text("method").notNull(),
    route: text("route").notNull(),
    networkFingerprint: text("network_fingerprint"),
    userAgentFingerprint: text("user_agent_fingerprint"),
    detail: text("detail"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("security_event_created_idx").on(table.createdAt),
    index("security_event_actor_created_idx").on(
      table.actorId,
      table.createdAt,
    ),
    index("security_event_type_created_idx").on(
      table.eventType,
      table.createdAt,
    ),
  ],
);

export const productionReadinessChecks = sqliteTable(
  "production_readiness_checks",
  {
    checkId: text("check_id").primaryKey(),
    ready: integer("ready", { mode: "boolean" }).notNull().default(false),
    verifiedBy: text("verified_by"),
    verifiedAt: text("verified_at"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
);
