import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getShopifyBatchCandidates,
  isShopifyBatchCandidate,
} from "@/features/admin/admin-catalog";
import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  listAdminProducts,
  markProductShopifyError,
  markProductShopifySynced,
  markProductShopifySyncing,
} from "@/server/catalog-repository";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { testShopifyConnection } from "@/server/shopify/admin-api";
import { syncProductToShopify } from "@/server/shopify/product-sync";

export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 10;
const syncBatchSchema = z.object({
  productIds: z.array(z.string().trim().min(1)).min(1).max(MAX_BATCH_SIZE),
});

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "catalog:publish",
    rateLimit: ADMIN_RATE_LIMITS.shopifySync,
  });
  if (authorization.response) return authorization.response;
  const { actor } = authorization;

  try {
    const parsedBody = syncBatchSchema.safeParse(
      await readLimitedJsonBody(request, 16 * 1024),
    );
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: `Selecciona entre 1 y ${MAX_BATCH_SIZE} productos por lote.` },
        { status: 400 },
      );
    }

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
    const candidates = getShopifyBatchCandidates(
      products,
      parsedBody.data.productIds,
      MAX_BATCH_SIZE,
    );
    const selectedIds = new Set(candidates.map(({ id }) => id));
    const skippedIds = parsedBody.data.productIds.filter(
      (productId) => !selectedIds.has(productId),
    );
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
      batchSize: MAX_BATCH_SIZE,
      attempted: results.length,
      succeeded: results.filter(({ status }) => status === "synced").length,
      failed: results.filter(({ status }) => status === "error").length,
      skipped: skippedIds.length,
      skippedIds,
      remaining,
      results,
    });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
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
