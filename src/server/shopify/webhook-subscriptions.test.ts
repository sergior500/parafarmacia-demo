import { describe, expect, it } from "vitest";

import {
  SHOPIFY_WEBHOOK_TOPICS,
  summarizeShopifyWebhookSubscriptions,
} from "@/server/shopify/webhook-subscriptions";

describe("Shopify webhook subscriptions", () => {
  const uri = "https://farmacia.example/api/shopify/webhooks";

  it("solo considera listas las suscripciones del endpoint actual", () => {
    const status = summarizeShopifyWebhookSubscriptions(
      SHOPIFY_WEBHOOK_TOPICS.map((topic, index) => ({
        id: String(index),
        topic,
        uri: index === 0 ? "https://old.example/webhook" : uri,
      })),
      uri,
    );

    expect(status.ready).toBe(false);
    expect(status.configured).toBe(4);
    expect(status.missingTopics).toEqual(["PRODUCTS_UPDATE"]);
  });

  it("queda listo con los cinco eventos operativos", () => {
    const status = summarizeShopifyWebhookSubscriptions(
      SHOPIFY_WEBHOOK_TOPICS.map((topic, index) => ({
        id: String(index),
        topic,
        uri,
      })),
      uri,
    );

    expect(status).toMatchObject({ ready: true, configured: 5, total: 5 });
  });
});
