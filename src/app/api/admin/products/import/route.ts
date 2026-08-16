import { NextResponse } from "next/server";

import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  changedCatalogCsvRecords,
  parseCatalogCsv,
  previewCatalogCsv,
} from "@/server/catalog-csv";
import {
  bulkUpdateAdminProducts,
  listAdminProducts,
} from "@/server/catalog-repository";
import {
  readLimitedTextBody,
  requestBodyErrorResponse,
} from "@/server/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "catalog:write",
    rateLimit: ADMIN_RATE_LIMITS.catalogImport,
  });
  if (authorization.response) return authorization.response;
  const { actor } = authorization;

  try {
    const csv = await readLimitedTextBody(request, {
      maxBytes: 1024 * 1024,
      contentTypes: ["text/csv", "application/vnd.ms-excel", "text/plain"],
    });
    const preview = previewCatalogCsv(
      parseCatalogCsv(csv),
      await listAdminProducts(),
    );
    if (preview.invalid > 0) {
      return NextResponse.json(
        { error: "Corrige las filas con errores antes de importar." },
        { status: 422 },
      );
    }
    const changedRows = changedCatalogCsvRecords(preview);
    const productIds = await bulkUpdateAdminProducts(changedRows, actor);
    return NextResponse.json({
      updated: productIds.length,
      unchanged: preview.unchanged,
      productIds,
    });
  } catch (error) {
    const requestError = requestBodyErrorResponse(error);
    if (requestError) return requestError;
    const message = error instanceof Error ? error.message : "";
    const duplicate = message.includes("UNIQUE") || message.includes("unique");
    return NextResponse.json(
      {
        error: duplicate
          ? "El archivo contiene un EAN ya asignado a otro producto."
          : message || "No se pudo aplicar la importación.",
      },
      { status: duplicate ? 409 : 500 },
    );
  }
}
