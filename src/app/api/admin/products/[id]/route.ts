import { NextResponse } from "next/server";

import { catalogProductUpdateSchema } from "@/features/admin/admin-catalog";
import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { updateAdminProduct } from "@/server/catalog-repository";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "catalog:write",
  });
  if (authorization.response) return authorization.response;
  const { actor } = authorization;

  let body: unknown;
  try {
    body = await readLimitedJsonBody(request);
  } catch (error) {
    return (
      requestBodyErrorResponse(error) ??
      NextResponse.json(
        { error: "No se pudo leer la petición." },
        { status: 400 },
      )
    );
  }
  const parsed = catalogProductUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Los cambios de la ficha no son válidos." },
      { status: 400 },
    );
  }

  if (
    parsed.data.reviewStatus === "published" &&
    (!(parsed.data.priceInCents && parsed.data.priceInCents > 0) ||
      parsed.data.stock === null ||
      !parsed.data.size ||
      !parsed.data.imageUrl)
  ) {
    return NextResponse.json(
      {
        error:
          "Para aprobar la ficha debes completar precio, stock, tamaño e imagen.",
      },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  try {
    const product = await updateAdminProduct(id, parsed.data, actor);
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const duplicate = message.includes("UNIQUE") || message.includes("unique");
    return NextResponse.json(
      {
        error: duplicate
          ? "Ya existe un producto con ese EAN."
          : "No se pudo actualizar la ficha.",
      },
      { status: duplicate ? 409 : 500 },
    );
  }
}
