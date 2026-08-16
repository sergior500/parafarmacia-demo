import { getDb } from "@db/index";
import { catalogAuditLog, products } from "@db/schema";
import { eq } from "drizzle-orm";

import {
  parseShopifyInventoryLevelPayload,
  parseShopifyProductPayload,
  SUPPORTED_SHOPIFY_WEBHOOK_TOPICS,
} from "@/server/shopify/webhooks";

const SHOPIFY_SYSTEM_ACTOR = {
  actorId: "shopify-webhook",
  actorEmail: "system@shopify.webhook",
};

export async function processShopifyWebhook(
  topic: string,
  payload: unknown,
): Promise<void> {
  if (!SUPPORTED_SHOPIFY_WEBHOOK_TOPICS.has(topic)) {
    throw new Error("Tema de webhook no permitido.");
  }
  if (topic === "inventory_levels/update") {
    const parsed = parseShopifyInventoryLevelPayload(payload);
    await updateInventoryFromShopify(
      parsed.inventory_item_id,
      parsed.available ?? 0,
    );
    return;
  }
  if (topic === "products/delete") {
    const parsed = parseShopifyProductPayload(payload);
    await markProductDeletedInShopify(parsed.id);
    return;
  }

  // Products/update and order events are deliberately acknowledged without
  // overwriting D1: this panel remains the catalog source of truth and orders
  // are queried live from Shopify until the local order module is introduced.
  parseShopifyProductPayload(payload);
}

async function updateInventoryFromShopify(
  inventoryItemId: string,
  available: number,
) {
  const db = getDb();
  const gid = `gid://shopify/InventoryItem/${inventoryItemId}`;
  const rows = await db
    .select({ productId: products.productId })
    .from(products)
    .where(eq(products.shopifyInventoryItemId, gid))
    .limit(1);
  const product = rows[0];
  if (!product) return;

  const now = new Date().toISOString();
  await db.batch([
    db
      .update(products)
      .set({ stockQuantity: available, updatedAt: now })
      .where(eq(products.productId, product.productId)),
    db.insert(catalogAuditLog).values({
      auditId: crypto.randomUUID(),
      productId: product.productId,
      action: "shopify_inventory_updated",
      ...SHOPIFY_SYSTEM_ACTOR,
      changesJson: JSON.stringify({ stock: available }),
      createdAt: now,
    }),
  ]);
}

async function markProductDeletedInShopify(shopifyProductId: string) {
  const db = getDb();
  const gid = `gid://shopify/Product/${shopifyProductId}`;
  const rows = await db
    .select({ productId: products.productId })
    .from(products)
    .where(eq(products.shopifyProductId, gid))
    .limit(1);
  const product = rows[0];
  if (!product) return;

  const now = new Date().toISOString();
  await db.batch([
    db
      .update(products)
      .set({
        shopifyProductId: null,
        shopifyVariantId: null,
        shopifyInventoryItemId: null,
        shopifySyncStatus: "not_synced",
        shopifySyncedAt: null,
        shopifyPayloadHash: null,
        shopifySyncError:
          "El producto fue eliminado en Shopify. Vuelve a sincronizarlo desde este panel.",
        shopifyPublicationStatus: "hidden",
        shopifyPublicationError: null,
        shopifyPublishedAt: null,
        availableOnline: false,
        updatedAt: now,
      })
      .where(eq(products.productId, product.productId)),
    db.insert(catalogAuditLog).values({
      auditId: crypto.randomUUID(),
      productId: product.productId,
      action: "shopify_product_deleted",
      ...SHOPIFY_SYSTEM_ACTOR,
      changesJson: JSON.stringify({ shopifyProductId: gid }),
      createdAt: now,
    }),
  ]);
}
