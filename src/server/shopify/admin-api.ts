import { getShopifyConfiguration } from "@/server/shopify/config";

interface GraphqlEnvelope<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

export class ShopifyApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
}

export const REQUIRED_SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_inventory",
  "write_inventory",
  "read_locations",
  "read_orders",
] as const;

export interface ShopifyConnectionDiagnostics {
  shop: { id: string; name: string; myshopifyDomain: string };
  grantedScopes: string[];
  missingScopes: string[];
  permissionsReady: boolean;
}

let cachedAccessToken:
  { storeDomain: string; token: string; expiresAt: number } | undefined;
let pendingAccessToken: Promise<string> | undefined;

async function requestClientCredentialsToken(): Promise<string> {
  const config = getShopifyConfiguration();
  if (
    !config.configured ||
    !config.storeDomain ||
    !config.clientId ||
    !config.clientSecret
  ) {
    throw new ShopifyApiError(
      `Shopify no está configurado. Falta: ${config.missing.join(", ")}.`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(
      `https://${config.storeDomain}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
        signal: controller.signal,
      },
    );
    const rawBody = await response.text();
    let body: AccessTokenResponse | null = null;
    try {
      body = JSON.parse(rawBody) as AccessTokenResponse;
    } catch {
      body = null;
    }
    if (!response.ok || !body?.access_token) {
      if (rawBody.includes("app_not_installed")) {
        throw new ShopifyApiError(
          "La aplicación todavía no está instalada en esta tienda Shopify.",
        );
      }
      if (rawBody.includes("shop_not_permitted")) {
        throw new ShopifyApiError(
          "La aplicación y la tienda deben pertenecer a la misma organización de Shopify.",
        );
      }
      throw new ShopifyApiError(
        response.status === 401 || response.status === 403
          ? "Shopify ha rechazado las credenciales de la aplicación."
          : "No se pudo obtener el acceso temporal de Shopify.",
      );
    }

    const expiresIn = Math.max(60, body.expires_in ?? 86_399);
    cachedAccessToken = {
      storeDomain: config.storeDomain,
      token: body.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    return body.access_token;
  } catch (error) {
    if (error instanceof ShopifyApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShopifyApiError(
        "Shopify tardó demasiado en conceder el acceso.",
      );
    }
    throw new ShopifyApiError(
      "No se pudo autenticar la aplicación en Shopify.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function getShopifyAdminAccessToken(): Promise<string> {
  const config = getShopifyConfiguration();
  if (config.adminAccessToken) return config.adminAccessToken;
  if (
    cachedAccessToken &&
    cachedAccessToken.storeDomain === config.storeDomain &&
    cachedAccessToken.expiresAt - Date.now() > 60_000
  ) {
    return cachedAccessToken.token;
  }

  pendingAccessToken ??= requestClientCredentialsToken().finally(() => {
    pendingAccessToken = undefined;
  });
  return pendingAccessToken;
}

export async function shopifyAdminGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const config = getShopifyConfiguration();
  if (!config.configured || !config.storeDomain) {
    throw new ShopifyApiError(
      `Shopify no está configurado. Falta: ${config.missing.join(", ")}.`,
    );
  }
  const accessToken = await getShopifyAdminAccessToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(
      `https://${config.storeDomain}/admin/api/${config.apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-shopify-access-token": accessToken,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      },
    );
    const body = (await response
      .json()
      .catch(() => null)) as GraphqlEnvelope<T> | null;
    if (!response.ok) {
      throw new ShopifyApiError(
        response.status === 401 || response.status === 403
          ? "Shopify ha rechazado las credenciales o los permisos."
          : `Shopify respondió con el estado ${response.status}.`,
      );
    }
    if (!body)
      throw new ShopifyApiError("Shopify devolvió una respuesta vacía.");
    if (body.errors?.length) {
      throw new ShopifyApiError(
        body.errors
          .map((error) => error.message || "Error GraphQL")
          .join(" · "),
      );
    }
    if (!body.data) throw new ShopifyApiError("Shopify no devolvió datos.");
    return body.data;
  } catch (error) {
    if (error instanceof ShopifyApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShopifyApiError("Shopify tardó demasiado en responder.");
    }
    throw new ShopifyApiError("No se pudo conectar con Shopify.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function testShopifyConnection() {
  const data = await shopifyAdminGraphql<{
    shop: { id: string; name: string; myshopifyDomain: string };
    currentAppInstallation: { accessScopes: Array<{ handle: string }> };
  }>(`
    query PicualShopConnection {
      shop { id name myshopifyDomain }
      currentAppInstallation { accessScopes { handle } }
    }
  `);
  const grantedScopes = data.currentAppInstallation.accessScopes.map(
    ({ handle }) => handle,
  );
  const missingScopes = REQUIRED_SHOPIFY_SCOPES.filter(
    (scope) => !grantedScopes.includes(scope),
  );
  return {
    shop: data.shop,
    grantedScopes,
    missingScopes,
    permissionsReady: missingScopes.length === 0,
  } satisfies ShopifyConnectionDiagnostics;
}
