import { shopifyAdminGraphql, ShopifyApiError } from "@/server/shopify/admin-api";

const PUBLICATIONS_QUERY = `
  query PicualOnlineStorePublication {
    publications(first: 50) {
      nodes { id supportsFuturePublishing }
    }
  }
`;

const PRODUCT_STATUS_MUTATION = `
  mutation PicualProductStatus($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id status }
      userErrors { field message }
    }
  }
`;

const PUBLISH_MUTATION = `
  mutation PicualPublishProduct($id: ID!, $publicationId: ID!) {
    publishablePublish(id: $id, input: { publicationId: $publicationId }) {
      publishable { publishedOnPublication(publicationId: $publicationId) }
      userErrors { field message }
    }
  }
`;

const UNPUBLISH_MUTATION = `
  mutation PicualUnpublishProduct($id: ID!, $publicationId: ID!) {
    publishableUnpublish(id: $id, input: { publicationId: $publicationId }) {
      publishable { publishedOnPublication(publicationId: $publicationId) }
      userErrors { field message }
    }
  }
`;

type UserError = { field?: string[]; message: string };

function assertNoUserErrors(errors: UserError[], fallback: string) {
  if (!errors.length) return;
  throw new ShopifyApiError(
    errors.map(({ message }) => message).filter(Boolean).join(" · ") || fallback,
  );
}

export async function getOnlineStorePublicationId(): Promise<string> {
  const data = await shopifyAdminGraphql<{
    publications: {
      nodes: Array<{ id: string; supportsFuturePublishing: boolean }>;
    };
  }>(PUBLICATIONS_QUERY);

  // Shopify only supports scheduled publishing on the Online Store channel.
  const publication = data.publications.nodes.find(
    ({ supportsFuturePublishing }) => supportsFuturePublishing,
  );
  if (!publication) {
    throw new ShopifyApiError(
      "No se encontró el canal Tienda online de Shopify.",
    );
  }
  return publication.id;
}

async function updateProductStatus(productId: string, status: "ACTIVE" | "DRAFT") {
  const data = await shopifyAdminGraphql<{
    productUpdate: {
      product: { id: string; status: string } | null;
      userErrors: UserError[];
    };
  }>(PRODUCT_STATUS_MUTATION, { product: { id: productId, status } });
  assertNoUserErrors(
    data.productUpdate.userErrors,
    "Shopify no pudo cambiar el estado del producto.",
  );
  if (!data.productUpdate.product) {
    throw new ShopifyApiError("Shopify no devolvió el producto actualizado.");
  }
}

async function publishProduct(productId: string, publicationId: string) {
  const data = await shopifyAdminGraphql<{
    publishablePublish: {
      publishable: { publishedOnPublication: boolean } | null;
      userErrors: UserError[];
    };
  }>(PUBLISH_MUTATION, { id: productId, publicationId });
  assertNoUserErrors(
    data.publishablePublish.userErrors,
    "Shopify no pudo publicar el producto.",
  );
  if (!data.publishablePublish.publishable?.publishedOnPublication) {
    throw new ShopifyApiError("Shopify no confirmó la publicación del producto.");
  }
}

async function unpublishProduct(productId: string, publicationId: string) {
  const data = await shopifyAdminGraphql<{
    publishableUnpublish: {
      publishable: { publishedOnPublication: boolean } | null;
      userErrors: UserError[];
    };
  }>(UNPUBLISH_MUTATION, { id: productId, publicationId });
  assertNoUserErrors(
    data.publishableUnpublish.userErrors,
    "Shopify no pudo retirar el producto del canal de venta.",
  );
  if (data.publishableUnpublish.publishable?.publishedOnPublication !== false) {
    throw new ShopifyApiError("Shopify no confirmó que el producto esté oculto.");
  }
}

export async function setShopifyProductPublication(
  productId: string,
  action: "publish" | "hide",
) {
  const publicationId = await getOnlineStorePublicationId();
  if (action === "publish") {
    // First attach the draft to the channel, then activate it. If activation
    // fails, the product remains a non-visible draft.
    await publishProduct(productId, publicationId);
    await updateProductStatus(productId, "ACTIVE");
  } else {
    // Draft status removes customer visibility immediately, even if the
    // publication cleanup subsequently fails.
    await updateProductStatus(productId, "DRAFT");
    await unpublishProduct(productId, publicationId);
  }
  return { publicationId, published: action === "publish" };
}
