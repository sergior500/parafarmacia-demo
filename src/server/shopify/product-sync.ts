import type { AdminCatalogProduct } from "@/features/admin/admin-catalog";
import { shopifyAdminGraphql, ShopifyApiError } from "@/server/shopify/admin-api";

const PRODUCT_SET_MUTATION = `
  mutation AmapolaProductSet($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
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

export function buildShopifyProductSetVariables(product: AdminCatalogProduct) {
  const defaultOption = "Formato";
  const defaultValue = product.size?.trim() || "Único";
  return {
    identifier: { handle: product.slug },
    input: {
      title: product.name,
      handle: product.slug,
      descriptionHtml: plainTextToHtml(product.description),
      vendor: product.brandOrLaboratory,
      productType: product.categoryId,
      status: "DRAFT",
      productOptions: [
        { name: defaultOption, position: 1, values: [{ name: defaultValue }] },
      ],
      variants: [
        {
          optionValues: [{ optionName: defaultOption, name: defaultValue }],
          price: (product.priceInCents / 100).toFixed(2),
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
