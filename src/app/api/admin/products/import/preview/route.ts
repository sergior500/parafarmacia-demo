import { NextResponse } from "next/server";

import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import { parseCatalogCsv, previewCatalogCsv } from "@/server/catalog-csv";
import { listAdminProducts } from "@/server/catalog-repository";
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
