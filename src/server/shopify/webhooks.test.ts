import { describe, expect, it } from "vitest";

import { verifyShopifyWebhook } from "@/server/shopify/webhooks";

async function sign(body: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

describe("Shopify webhook verification", () => {
  it("accepts the original signed body and rejects modified content", async () => {
    const body = JSON.stringify({ id: 123 });
    const hmac = await sign(body, "secret");
    await expect(verifyShopifyWebhook(body, hmac, "secret")).resolves.toBe(true);
    await expect(verifyShopifyWebhook(`${body} `, hmac, "secret")).resolves.toBe(false);
  });
});
