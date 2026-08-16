import type { AdminCatalogProduct } from "@/features/admin/admin-catalog";
import { pharmacyConfig } from "@/lib/config";
import { shopifyAdminGraphql, ShopifyApiError } from "@/server/shopify/admin-api";

const PRODUCT_SET_MUTATION = `
  mutation PicualProductSet($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
    productSet(identifier: $identifier, input: $input, synchronous: true) {
      product {
        id
        handle
        variants(first: 1) {
          nodes { id inventoryItem { id } }
        }
      }
      userErrors { field message }
    }
  }
`;

function plainTextToHtml(value: string): string {
  const escaped = value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function shopifyImageInput(
  imageUrl: string,
  productName: string,
  siteUrl: string,
) {
  try {
    const url = new URL(imageUrl, siteUrl);
    if (url.protocol !== "https:") return undefined;
    return {
      originalSource: url.toString(),
      alt: productName,
      contentType: "IMAGE",
    };
  } catch {
    return undefined;
  }
}

export function buildShopifyProductSetVariables(
  product: AdminCatalogProduct,
  siteUrl = pharmacyConfig.siteUrl,
) {
  const defaultOption = "Formato";
  const defaultValue = product.size?.trim() || "Pendiente de definir";
  const isCommerciallyComplete =
    product.priceVerified &&
    product.priceInCents > 0 &&
    product.stockVerified &&
    Boolean(product.size?.trim()) &&
    Boolean(product.imageUrl.trim());
  const image = shopifyImageInput(product.imageUrl, product.name, siteUrl);
  return {
    identifier: { handle: product.slug },
    input: {
      title: product.name,
      handle: product.slug,
      descriptionHtml: plainTextToHtml(product.description),
      vendor: product.brandOrLaboratory,
      productType: product.categoryId,
      status: "DRAFT",
      tags: isCommerciallyComplete
        ? ["Farmacia Picual"]
        : ["Farmacia Picual", "Pendiente de completar"],
      ...(image ? { files: [image] } : {}),
      productOptions: [
        { name: defaultOption, position: 1, values: [{ name: defaultValue }] },
      ],
      variants: [
        {
          optionValues: [{ optionName: defaultOption, name: defaultValue }],
          price:
            product.priceVerified && product.priceInCents > 0
              ? (product.priceInCents / 100).toFixed(2)
              : "0.00",
          ...(product.ean ? { barcode: product.ean, sku: product.ean } : {}),
        },
      ],
    },
  };
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function syncProductToShopify(product: AdminCatalogProduct) {
  const variables = buildShopifyProductSetVariables(product);
  const data = await shopifyAdminGraphql<{
    productSet: {
      product: {
        id: string;
        variants: { nodes: Array<{ id: string; inventoryItem?: { id: string } }> };
      } | null;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(PRODUCT_SET_MUTATION, variables);

  if (data.productSet.userErrors.length) {
    throw new ShopifyApiError(
      data.productSet.userErrors.map((error) => error.message).join(" · "),
    );
  }
  if (!data.productSet.product) {
    throw new ShopifyApiError("Shopify no devolvió el producto sincronizado.");
  }

  const variant = data.productSet.product.variants.nodes[0];
  return {
    productId: data.productSet.product.id,
    variantId: variant?.id,
    inventoryItemId: variant?.inventoryItem?.id,
    payloadHash: await sha256(JSON.stringify(variables.input)),
  };
}
