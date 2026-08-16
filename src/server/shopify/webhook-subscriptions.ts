import { pharmacyConfig } from "@/lib/config";
import {
  shopifyAdminGraphql,
  ShopifyApiError,
} from "@/server/shopify/admin-api";

export const SHOPIFY_WEBHOOK_TOPICS = [
  "PRODUCTS_UPDATE",
  "PRODUCTS_DELETE",
  "INVENTORY_LEVELS_UPDATE",
  "ORDERS_CREATE",
  "ORDERS_UPDATED",
] as const;

interface ShopifyWebhookSubscription {
  id: string;
  topic: string;
  uri: string;
}

export interface ShopifyWebhookStatus {
  callbackUrl: string;
  configured: number;
  total: number;
  ready: boolean;
  missingTopics: string[];
}

function callbackUrl() {
  const siteUrl = pharmacyConfig.siteUrl.replace(/\/$/, "");
  if (!siteUrl.startsWith("https://")) {
    throw new ShopifyApiError(
      "Configura una URL pública HTTPS antes de activar los webhooks.",
    );
  }
  return `${siteUrl}/api/shopify/webhooks`;
}

async function listShopifyWebhookSubscriptions() {
  const data = await shopifyAdminGraphql<{
    webhookSubscriptions: { nodes: ShopifyWebhookSubscription[] };
  }>(`
    query PicualWebhookSubscriptions {
      webhookSubscriptions(first: 100) {
        nodes { id topic uri }
      }
    }
  `);
  return data.webhookSubscriptions.nodes;
}

export function summarizeShopifyWebhookSubscriptions(
  subscriptions: ShopifyWebhookSubscription[],
  uri: string,
): ShopifyWebhookStatus {
  const configuredTopics = new Set(
    subscriptions
      .filter((subscription) => subscription.uri === uri)
      .map((subscription) => subscription.topic),
  );
  const missingTopics = SHOPIFY_WEBHOOK_TOPICS.filter(
    (topic) => !configuredTopics.has(topic),
  );
  return {
    callbackUrl: uri,
    configured: SHOPIFY_WEBHOOK_TOPICS.length - missingTopics.length,
    total: SHOPIFY_WEBHOOK_TOPICS.length,
    ready: missingTopics.length === 0,
    missingTopics,
  };
}

export async function getShopifyWebhookStatus() {
  const uri = callbackUrl();
  return summarizeShopifyWebhookSubscriptions(
    await listShopifyWebhookSubscriptions(),
    uri,
  );
}

export async function ensureShopifyWebhookSubscriptions() {
  const uri = callbackUrl();
  const current = await listShopifyWebhookSubscriptions();
  const status = summarizeShopifyWebhookSubscriptions(current, uri);

  for (const topic of status.missingTopics) {
    const data = await shopifyAdminGraphql<{
      webhookSubscriptionCreate: {
        webhookSubscription: ShopifyWebhookSubscription | null;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    }>(
      `
        mutation PicualWebhookSubscriptionCreate(
          $topic: WebhookSubscriptionTopic!
          $webhookSubscription: WebhookSubscriptionInput!
        ) {
          webhookSubscriptionCreate(
            topic: $topic
            webhookSubscription: $webhookSubscription
          ) {
            webhookSubscription { id topic uri }
            userErrors { field message }
          }
        }
      `,
      { topic, webhookSubscription: { uri } },
    );
    const result = data.webhookSubscriptionCreate;
    if (result.userErrors.length || !result.webhookSubscription) {
      throw new ShopifyApiError(
        result.userErrors.map(({ message }) => message).join(" · ") ||
          `Shopify no pudo registrar ${topic}.`,
      );
    }
  }

  return getShopifyWebhookStatus();
}
