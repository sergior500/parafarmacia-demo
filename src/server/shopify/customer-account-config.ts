import { pharmacyConfig } from "@/lib/config";
import { getShopifyConfiguration } from "@/server/shopify/config";

export interface ShopifyCustomerAccountConfiguration {
  configured: boolean;
  storeDomain?: string;
  clientId?: string;
  siteOrigin?: string;
  callbackUri?: string;
  logoutUri?: string;
  missing: string[];
}

export function getShopifyCustomerAccountConfiguration(): ShopifyCustomerAccountConfiguration {
  const shopify = getShopifyConfiguration();
  const clientId =
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim() || shopify.clientId;
  const siteOrigin = trustedSiteOrigin(pharmacyConfig.siteUrl);
  const missing: string[] = [];
  if (!shopify.storeDomain) missing.push("dominio de Shopify");
  if (!clientId) missing.push("cliente de cuentas de Shopify");
  if (!siteOrigin) missing.push("URL pública segura");
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.CUSTOMER_SESSION_SECRET ||
      process.env.CUSTOMER_SESSION_SECRET.trim().length < 32)
  ) {
    missing.push("secreto de sesión de clientes");
  }
  return {
    configured: missing.length === 0,
    storeDomain: shopify.storeDomain,
    clientId,
    siteOrigin,
    callbackUri: siteOrigin
      ? `${siteOrigin}/api/customer/auth/callback`
      : undefined,
    logoutUri: siteOrigin ? `${siteOrigin}/cuenta?sesion=cerrada` : undefined,
    missing,
  };
}

function trustedSiteOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.pathname !== "/") return undefined;
    if (
      url.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")
    ) {
      return undefined;
    }
    return url.origin;
  } catch {
    return undefined;
  }
}
