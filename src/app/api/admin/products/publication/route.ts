import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminActor, isSameOriginRequest } from "@/server/admin-auth";
import { adminMutationRateLimitResponse } from "@/server/admin-security";
import { listAdminProducts } from "@/server/catalog-repository";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { testShopifyConnection } from "@/server/shopify/admin-api";
import {
  changeProductPublication,
  publicationEligibilityError,
} from "@/server/shopify/publication-workflow";

export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 10;
const publicationBatchSchema = z.object({
  action: z.enum(["publish", "hide"]),
  productIds: z.array(z.string().trim().min(1)).min(1).max(MAX_BATCH_SIZE),
});
const REQUIRED_PUBLICATION_SCOPES = [
  "write_products",
  "read_publications",
  "write_publications",
] as const;

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  const rateLimited = adminMutationRateLimitResponse(actor.userId);
  if (rateLimited) return rateLimited;

  try {
    const parsed = publicationBatchSchema.safeParse(
      await readLimitedJsonBody(request, 16 * 1024),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Selecciona entre 1 y ${MAX_BATCH_SIZE} productos por lote.` },
        { status: 400 },
      );
    }

    const connection = await testShopifyConnection();
    const missingScopes = REQUIRED_PUBLICATION_SCOPES.filter(
      (scope) => !connection.grantedScopes.includes(scope),
    );
    if (missingScopes.length) {
      return NextResponse.json(
        {
          error:
            "Falta autorizar en Shopify los permisos para gestionar canales de venta.",
          missingScopes,
        },
        { status: 409 },
      );
    }

    const productsById = new Map(
      (await listAdminProducts()).map((product) => [product.id, product]),
    );
    const results: Array<{
      productId: string;
      status: "changed" | "skipped" | "error";
      error?: string;
    }> = [];
    for (const productId of parsed.data.productIds) {
      const product = productsById.get(productId);
      const eligibilityError = product
        ? publicationEligibilityError(product, parsed.data.action)
        : "Producto no encontrado.";
      if (!product || eligibilityError) {
        results.push({ productId, status: "skipped", error: eligibilityError ?? undefined });
        continue;
      }
      try {
        await changeProductPublication(product, parsed.data.action, actor);
        results.push({ productId, status: "changed" });
      } catch (error) {
        results.push({
          productId,
          status: "error",
          error: error instanceof Error ? error.message : "Error de Shopify.",
        });
      }
    }

    return NextResponse.json({
      action: parsed.data.action,
      changed: results.filter(({ status }) => status === "changed").length,
      skipped: results.filter(({ status }) => status === "skipped").length,
      failed: results.filter(({ status }) => status === "error").length,
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
            : "No se pudo procesar la publicación por lotes.",
      },
      { status: 409 },
    );
  }
}
