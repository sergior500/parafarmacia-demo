import { NextResponse } from "next/server";

import { getAdminActor, isSameOriginRequest } from "@/server/admin-auth";
import { parseCatalogCsv, previewCatalogCsv } from "@/server/catalog-csv";
import { listAdminProducts } from "@/server/catalog-repository";
import {
  readLimitedTextBody,
  requestBodyErrorResponse,
} from "@/server/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  try {
    const csv = await readLimitedTextBody(request, {
      maxBytes: 1024 * 1024,
      contentTypes: ["text/csv", "application/vnd.ms-excel", "text/plain"],
    });
    const preview = previewCatalogCsv(
      parseCatalogCsv(csv),
      await listAdminProducts(),
    );
    return NextResponse.json({ preview: publicPreview(preview) });
  } catch (error) {
    return (
      requestBodyErrorResponse(error) ??
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "No se pudo revisar el archivo.",
        },
        { status: 400 },
      )
    );
  }
}

function publicPreview(preview: ReturnType<typeof previewCatalogCsv>) {
  return {
    ...preview,
    rows: preview.rows.map((row) => ({
      rowNumber: row.rowNumber,
      productId: row.productId,
      name: row.name,
      changes: row.changes,
      errors: row.errors,
    })),
  };
}
