import { NextResponse } from "next/server";

import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  findAdminProduct,
  markProductShopifyError,
  markProductShopifySynced,
  markProductShopifySyncing,
} from "@/server/catalog-repository";
import { getShopifyConfiguration } from "@/server/shopify/config";
import { syncProductToShopify } from "@/server/shopify/product-sync";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "catalog:publish",
    rateLimit: ADMIN_RATE_LIMITS.shopifySync,
  });
  if (authorization.response) return authorization.response;
  const { actor } = authorization;

  const { id } = await context.params;
  const product = await findAdminProduct(id);
  if (!product)
    return NextResponse.json(
      { error: "Producto no encontrado." },
      { status: 404 },
    );
  const configuration = getShopifyConfiguration();
  if (!configuration.configured) {
    return NextResponse.json(
      {
        error: `Shopify aún no está conectado. Falta: ${configuration.missing.join(", ")}.`,
      },
      { status: 409 },
    );
  }

  await markProductShopifySyncing(id);
  try {
    const result = await syncProductToShopify(product);
    await markProductShopifySynced(id, result, actor);
    return NextResponse.json({ product: await findAdminProduct(id) });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo sincronizar el producto.";
    await markProductShopifyError(id, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
