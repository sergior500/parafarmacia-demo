import { NextResponse } from "next/server";

import { getAdminActor, isSameOriginRequest } from "@/server/admin-auth";
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
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const { id } = await context.params;
  const product = await findAdminProduct(id);
  if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  const configuration = getShopifyConfiguration();
  if (!configuration.configured) {
    return NextResponse.json(
      { error: `Shopify aún no está conectado. Falta: ${configuration.missing.join(", ")}.` },
      { status: 409 },
    );
  }

  await markProductShopifySyncing(id);
  try {
    const result = await syncProductToShopify(product);
    await markProductShopifySynced(id, result, actor);
    return NextResponse.json({ product: await findAdminProduct(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sincronizar el producto.";
    await markProductShopifyError(id, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
