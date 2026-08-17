import { describe, expect, it } from "vitest";

import {
  getShopifyWebhookResourceId,
  SUPPORTED_SHOPIFY_WEBHOOK_TOPICS,
  verifyShopifyWebhook,
  verifyShopifyWebhookWithSecrets,
} from "@/server/shopify/webhooks";

async function sign(body: string, secret: string) {
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
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

describe("Shopify webhook verification", () => {
  it("accepts the original signed body and rejects modified content", async () => {
    const body = JSON.stringify({ id: 123 });
    const hmac = await sign(body, "secret");
    await expect(verifyShopifyWebhook(body, hmac, "secret")).resolves.toBe(
      true,
    );
    await expect(
      verifyShopifyWebhook(`${body} `, hmac, "secret"),
    ).resolves.toBe(false);
  });

  it("acepta firmas del secreto anterior y del nuevo durante una rotación", async () => {
    const body = JSON.stringify({ id: 123 });
    const oldHmac = await sign(body, "old-secret");
    const newHmac = await sign(body, "new-secret");
    const secrets = ["old-secret", "new-secret"];

    await expect(
      verifyShopifyWebhookWithSecrets(body, oldHmac, secrets),
    ).resolves.toBe(true);
    await expect(
      verifyShopifyWebhookWithSecrets(body, newHmac, secrets),
    ).resolves.toBe(true);
    await expect(
      verifyShopifyWebhookWithSecrets(body, await sign(body, "other"), secrets),
    ).resolves.toBe(false);
  });

  it("identifica los recursos de producto, pedido e inventario", () => {
    expect(getShopifyWebhookResourceId("products/delete", { id: 123 })).toBe(
      "123",
    );
    expect(getShopifyWebhookResourceId("orders/create", { id: "456" })).toBe(
      "456",
    );
    expect(
      getShopifyWebhookResourceId("inventory_levels/update", {
        inventory_item_id: 789,
        available: 4,
      }),
    ).toBe("789");
  });

  it("limita los eventos a la lista operativa del panel", () => {
    expect(SUPPORTED_SHOPIFY_WEBHOOK_TOPICS.has("products/update")).toBe(true);
    expect(SUPPORTED_SHOPIFY_WEBHOOK_TOPICS.has("orders/create")).toBe(true);
    expect(SUPPORTED_SHOPIFY_WEBHOOK_TOPICS.has("customers/create")).toBe(
      false,
    );
  });
});
