import { NextResponse } from "next/server";

import { catalogProductCreateSchema } from "@/features/admin/admin-catalog";
import {
  authorizeAdminMutation,
  authorizeAdminRead,
} from "@/server/admin-request-guard";
import {
  createAdminProduct,
  listAdminProducts,
} from "@/server/catalog-repository";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const authorization = await authorizeAdminRead("catalog:read");
  if (authorization.response) return authorization.response;

  try {
    return NextResponse.json({ products: await listAdminProducts() });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error: "No se pudo cargar el catálogo.",
        ...(process.env.NODE_ENV !== "production" ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
  const parsed = catalogProductCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Los datos del producto no son válidos." },
      { status: 400 },
    );
  }

  try {
    const product = await createAdminProduct(parsed.data, actor);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const duplicate = message.includes("UNIQUE") || message.includes("unique");
    return NextResponse.json(
      {
        error: duplicate
          ? "Ya existe un producto con ese EAN."
          : "No se pudo guardar el producto.",
      },
      { status: duplicate ? 409 : 500 },
    );
  }
}
