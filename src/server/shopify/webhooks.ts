import { z } from "zod";

export const SUPPORTED_SHOPIFY_WEBHOOK_TOPICS = new Set([
  "products/update",
  "products/delete",
  "inventory_levels/update",
  "orders/create",
  "orders/updated",
]);

export async function verifyShopifyWebhook(
  body: string,
  receivedHmac: string | null,
  secret: string,
): Promise<boolean> {
  if (!receivedHmac || !secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  if (expected.length !== receivedHmac.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ receivedHmac.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifyShopifyWebhookWithSecrets(
  body: string,
  receivedHmac: string | null,
  secrets: readonly string[],
): Promise<boolean> {
  if (!receivedHmac || secrets.length === 0) return false;
  const results = await Promise.all(
    Array.from(new Set(secrets.filter(Boolean))).map((secret) =>
      verifyShopifyWebhook(body, receivedHmac, secret),
    ),
  );
  return results.some(Boolean);
}

const numericShopifyId = z
  .union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
  .transform(String);

const inventoryLevelPayload = z.object({
  inventory_item_id: numericShopifyId,
  available: z.number().int().nullable(),
});

const productPayload = z.object({ id: numericShopifyId });

export function parseShopifyInventoryLevelPayload(payload: unknown) {
  return inventoryLevelPayload.parse(payload);
}

export function parseShopifyProductPayload(payload: unknown) {
  return productPayload.parse(payload);
}

export function getShopifyWebhookResourceId(
  topic: string,
  payload: unknown,
): string | null {
  if (topic === "inventory_levels/update") {
    const result = inventoryLevelPayload.safeParse(payload);
    return result.success ? result.data.inventory_item_id : null;
  }
  if (topic.startsWith("products/") || topic.startsWith("orders/")) {
    const result = productPayload.safeParse(payload);
    return result.success ? result.data.id : null;
  }
  return null;
}
