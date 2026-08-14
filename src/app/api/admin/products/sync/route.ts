import { NextResponse } from "next/server";

import {
  getShopifyBatchCandidates,
  isShopifyBatchCandidate,
} from "@/features/admin/admin-catalog";
import { getAdminActor, isSameOriginRequest } from "@/server/admin-auth";
import {
  listAdminProducts,
  markProductShopifyError,
  markProductShopifySynced,
  markProductShopifySyncing,
} from "@/server/catalog-repository";
import { testShopifyConnection } from "@/server/shopify/admin-api";
import { syncProductToShopify } from "@/server/shopify/product-sync";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 5;

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  }

  try {
    const connection = await testShopifyConnection();
    if (!connection.grantedScopes.includes("write_products")) {
      return NextResponse.json(
        {
          error:
            "La aplicación está instalada, pero falta autorizar el permiso para gestionar productos.",
          missingScopes: ["write_products"],
        },
        { status: 409 },
      );
    }

    const products = await listAdminProducts();
    const candidates = getShopifyBatchCandidates(products, BATCH_SIZE);
    const results: Array<{
      productId: string;
      name: string;
      status: "synced" | "error";
      error?: string;
    }> = [];

    for (const product of candidates) {
      await markProductShopifySyncing(product.id);
      try {
        const result = await syncProductToShopify(product);
        await markProductShopifySynced(product.id, result, actor);
        results.push({
          productId: product.id,
          name: product.name,
          status: "synced",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo sincronizar el producto.";
        await markProductShopifyError(product.id, message);
        results.push({
          productId: product.id,
          name: product.name,
          status: "error",
          error: message,
        });
      }
    }

    const remaining = (await listAdminProducts()).filter(
      isShopifyBatchCandidate,
    ).length;
    return NextResponse.json({
      batchSize: BATCH_SIZE,
      attempted: results.length,
      succeeded: results.filter(({ status }) => status === "synced").length,
      failed: results.filter(({ status }) => status === "error").length,
      remaining,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar la sincronización por lotes.",
      },
      { status: 409 },
    );
  }
}
