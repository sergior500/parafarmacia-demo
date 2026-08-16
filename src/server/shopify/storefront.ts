import { getDb } from "@db/index";
import { products } from "@db/schema";
import { inArray } from "drizzle-orm";

import type { CheckoutRequest } from "@/server/shopify/checkout-contract";
import {
  buildShopifyCartInput,
  safeShopifyCheckoutUrl,
} from "@/server/shopify/checkout-contract";
import { getShopifyConfiguration } from "@/server/shopify/config";
import { getShopifyStorefrontAccessToken } from "@/server/shopify/storefront-token";

interface StorefrontEnvelope<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

interface CartCreateData {
  cartCreate: {
    cart: {
      id: string;
      checkoutUrl: string;
      totalQuantity: number;
    } | null;
    userErrors: Array<{ field?: string[]; message: string }>;
    warnings: Array<{ message: string }>;
  };
}

export class ShopifyCheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyCheckoutError";
  }
}

export async function createShopifyCheckout(
  input: CheckoutRequest,
  buyerIp?: string,
) {
  const requestedIds = input.lines.map(({ productId }) => productId);
  const rows = await getDb()
    .select({
      productId: products.productId,
      name: products.name,
      stockQuantity: products.stockQuantity,
      maximumUnitsPerOrder: products.maximumUnitsPerOrder,
      shopifyVariantId: products.shopifyVariantId,
      shopifySyncStatus: products.shopifySyncStatus,
    })
    .from(products)
    .where(inArray(products.productId, requestedIds));
  const productsById = new Map(rows.map((row) => [row.productId, row]));

  const lines = input.lines.map(({ productId, quantity }) => {
    const product = productsById.get(productId);
    if (!product) {
      throw new ShopifyCheckoutError(
        "Uno de los productos ya no forma parte del catálogo.",
      );
    }
    if (product.shopifySyncStatus !== "synced" || !product.shopifyVariantId) {
      throw new ShopifyCheckoutError(
        `${product.name} todavía no está preparado para el pago.`,
      );
    }
    if (quantity > product.maximumUnitsPerOrder) {
      throw new ShopifyCheckoutError(
        `El máximo permitido de ${product.name} es ${product.maximumUnitsPerOrder}.`,
      );
    }
    if (product.stockQuantity !== null && quantity > product.stockQuantity) {
      throw new ShopifyCheckoutError(
        `Shopify no tiene unidades suficientes de ${product.name}.`,
      );
    }
    return { merchandiseId: product.shopifyVariantId, quantity };
  });

  return createStorefrontCart(lines, input.discountCode, buyerIp);
}

async function createStorefrontCart(
  lines: Array<{ merchandiseId: string; quantity: number }>,
  discountCode?: string,
  buyerIp?: string,
) {
  const configuration = getShopifyConfiguration();
  if (!configuration.storeDomain) {
    throw new ShopifyCheckoutError("La tienda todavía no está conectada.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const storefrontAccessToken = await getShopifyStorefrontAccessToken();
    const response = await fetch(
      `https://${configuration.storeDomain}/api/${configuration.apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-shopify-storefront-access-token": storefrontAccessToken,
          ...(buyerIp ? { "shopify-storefront-buyer-ip": buyerIp } : {}),
        },
        body: JSON.stringify({
          query: `
            mutation PicualCartCreate($input: CartInput!) {
              cartCreate(input: $input) {
                cart { id checkoutUrl totalQuantity }
                userErrors { field message }
                warnings { message }
              }
            }
          `,
          variables: { input: buildShopifyCartInput(lines, discountCode) },
        }),
        signal: controller.signal,
      },
    );
    const envelope = (await response
      .json()
      .catch(() => null)) as StorefrontEnvelope<CartCreateData> | null;
    if (!response.ok || !envelope) {
      throw new ShopifyCheckoutError(
        response.status === 430
          ? "Shopify ha bloqueado temporalmente la petición automática."
          : "Shopify no pudo iniciar el pago.",
      );
    }
    if (envelope.errors?.length) {
      throw new ShopifyCheckoutError(
        envelope.errors
          .map(({ message }) => message)
          .filter(Boolean)
          .join(" · ") || "Shopify rechazó la creación del carrito.",
      );
    }
    const result = envelope.data?.cartCreate;
    if (!result || result.userErrors.length || !result.cart) {
      throw new ShopifyCheckoutError(
        result?.userErrors.map(({ message }) => message).join(" · ") ||
          "Algún producto todavía no está disponible para comprar en Shopify.",
      );
    }
    return {
      cartId: result.cart.id,
      checkoutUrl: safeShopifyCheckoutUrl(result.cart.checkoutUrl),
      totalQuantity: result.cart.totalQuantity,
      warnings: result.warnings.map(({ message }) => message),
    };
  } catch (error) {
    if (error instanceof ShopifyCheckoutError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShopifyCheckoutError(
        "Shopify ha tardado demasiado en preparar el pago.",
      );
    }
    throw new ShopifyCheckoutError("No se pudo conectar con el pago seguro.");
  } finally {
    clearTimeout(timeout);
  }
}
