import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import { findAdminProduct } from "@/server/catalog-repository";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { testShopifyConnection } from "@/server/shopify/admin-api";
import { changeProductPublication } from "@/server/shopify/publication-workflow";

export const dynamic = "force-dynamic";

const publicationSchema = z.object({ action: z.enum(["publish", "hide"]) });
const REQUIRED_PUBLICATION_SCOPES = [
  "write_products",
  "read_publications",
  "write_publications",
] as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "catalog:publish",
    rateLimit: ADMIN_RATE_LIMITS.publication,
  });
  if (authorization.response) return authorization.response;
  const { actor } = authorization;

  try {
    const parsed = publicationSchema.safeParse(
      await readLimitedJsonBody(request, 4 * 1024),
    );
    if (!parsed.success) {
      return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
    }
    const { id } = await context.params;
    const product = await findAdminProduct(id);
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 },
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

    const updated = await changeProductPublication(
      product,
      parsed.data.action,
      actor,
    );
    return NextResponse.json({ product: updated });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cambiar la visibilidad del producto.",
      },
      { status: 409 },
    );
  }
}
