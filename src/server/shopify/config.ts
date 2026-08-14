const DEFAULT_API_VERSION = "2026-07";

export interface ShopifyConfigurationStatus {
  configured: boolean;
  storeDomain?: string;
  apiVersion: string;
  missing: string[];
}

export function normalizeShopifyStoreDomain(value: string): string | null {
  const candidate = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(candidate)) return null;
  return candidate;
}

export function getShopifyConfiguration(): ShopifyConfigurationStatus & {
  adminAccessToken?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
} {
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN ?? "";
  const storeDomain = normalizeShopifyStoreDomain(rawDomain) ?? undefined;
  const adminAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  const webhookSecret =
    process.env.SHOPIFY_WEBHOOK_SECRET?.trim() || clientSecret;
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_API_VERSION;
  const missing: string[] = [];

  if (!storeDomain) missing.push("Dominio de la tienda");
  if (!adminAccessToken) {
    if (!clientId) missing.push("Client ID");
    if (!clientSecret) missing.push("Client secret");
  }

  return {
    configured: missing.length === 0,
    storeDomain,
    adminAccessToken,
    clientId,
    clientSecret,
    webhookSecret,
    apiVersion,
    missing,
  };
}

export function getPublicShopifyStatus(): ShopifyConfigurationStatus {
  const { configured, storeDomain, apiVersion, missing } =
    getShopifyConfiguration();
  return { configured, storeDomain, apiVersion, missing };
}
