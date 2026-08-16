import { shopifyAdminGraphql } from "@/server/shopify/admin-api";
import { getShopifyConfiguration } from "@/server/shopify/config";

const STOREFRONT_TOKEN_TITLE = "Farmacia Picual checkout";
const REQUIRED_STOREFRONT_SCOPES = [
  "unauthenticated_read_product_listings",
  "unauthenticated_write_checkouts",
  "unauthenticated_read_checkouts",
] as const;

interface StorefrontAccessToken {
  accessToken: string;
  title: string;
  accessScopes: Array<{ handle: string }>;
}

interface StorefrontTokenCreatePayload {
  storefrontAccessTokenCreate: {
    storefrontAccessToken: StorefrontAccessToken | null;
    userErrors: Array<{ message: string }>;
  };
}

let cachedStorefrontToken: string | undefined;
let pendingStorefrontToken: Promise<string> | undefined;

export function hasRequiredStorefrontScopes(token: StorefrontAccessToken) {
  const scopes = new Set(token.accessScopes.map(({ handle }) => handle));
  return REQUIRED_STOREFRONT_SCOPES.every((scope) => scopes.has(scope));
}

export function selectReusableStorefrontToken(tokens: StorefrontAccessToken[]) {
  return tokens.find(
    (token) =>
      token.title === STOREFRONT_TOKEN_TITLE &&
      hasRequiredStorefrontScopes(token),
  );
}

async function loadOrCreateStorefrontToken() {
  const existing = await listStorefrontTokens();
  const reusable = selectReusableStorefrontToken(existing);
  if (reusable) return reusable.accessToken;

  const created = await shopifyAdminGraphql<StorefrontTokenCreatePayload>(
    `
      mutation PicualStorefrontTokenCreate($input: StorefrontAccessTokenInput!) {
        storefrontAccessTokenCreate(input: $input) {
          storefrontAccessToken {
            accessToken
            title
            accessScopes { handle }
          }
          userErrors { message }
        }
      }
    `,
    { input: { title: STOREFRONT_TOKEN_TITLE } },
  );
  const result = created.storefrontAccessTokenCreate;
  if (result.userErrors.length || !result.storefrontAccessToken) {
    throw new Error(
      result.userErrors.map(({ message }) => message).join(" ") ||
        "Shopify no pudo autorizar el checkout.",
    );
  }
  if (!hasRequiredStorefrontScopes(result.storefrontAccessToken)) {
    throw new Error(
      "La aplicación de Shopify todavía no tiene los permisos de checkout.",
    );
  }
  return result.storefrontAccessToken.accessToken;
}

async function listStorefrontTokens() {
  const existing = await shopifyAdminGraphql<{
    shop: { storefrontAccessTokens: { nodes: StorefrontAccessToken[] } };
  }>(`
    query PicualStorefrontTokens {
      shop {
        storefrontAccessTokens(first: 100) {
          nodes { accessToken title accessScopes { handle } }
        }
      }
    }
  `);
  return existing.shop.storefrontAccessTokens.nodes;
}

export async function getShopifyStorefrontTokenStatus() {
  if (getShopifyConfiguration().storefrontAccessToken?.trim()) {
    return { ready: true, source: "environment" as const };
  }
  const reusable = selectReusableStorefrontToken(await listStorefrontTokens());
  return {
    ready: Boolean(reusable),
    source: reusable ? ("shopify" as const) : ("missing" as const),
  };
}

export async function getShopifyStorefrontAccessToken() {
  const configuredToken =
    getShopifyConfiguration().storefrontAccessToken?.trim();
  if (configuredToken) return configuredToken;
  if (cachedStorefrontToken) return cachedStorefrontToken;

  pendingStorefrontToken ??= loadOrCreateStorefrontToken()
    .then((token) => {
      cachedStorefrontToken = token;
      return token;
    })
    .finally(() => {
      pendingStorefrontToken = undefined;
    });
  return pendingStorefrontToken;
}
