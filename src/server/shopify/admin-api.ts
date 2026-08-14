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

export async function shopifyAdminGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const config = getShopifyConfiguration();
  if (!config.configured || !config.storeDomain || !config.adminAccessToken) {
    throw new ShopifyApiError(
      `Shopify no está configurado. Falta: ${config.missing.join(", ")}.`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(
      `https://${config.storeDomain}/admin/api/${config.apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-shopify-access-token": config.adminAccessToken,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      },
    );
    const body = (await response.json().catch(() => null)) as GraphqlEnvelope<T> | null;
    if (!response.ok) {
      throw new ShopifyApiError(
        response.status === 401 || response.status === 403
          ? "Shopify ha rechazado las credenciales o los permisos."
          : `Shopify respondió con el estado ${response.status}.`,
      );
    }
    if (!body) throw new ShopifyApiError("Shopify devolvió una respuesta vacía.");
    if (body.errors?.length) {
      throw new ShopifyApiError(
        body.errors.map((error) => error.message || "Error GraphQL").join(" · "),
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
  }>(`query PicualShopConnection { shop { id name myshopifyDomain } }`);
  return data.shop;
}
