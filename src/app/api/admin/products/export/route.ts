import { NextResponse } from "next/server";

import { authorizeAdminRead } from "@/server/admin-request-guard";
import { buildCatalogCsv } from "@/server/catalog-csv";
import { listAdminProducts } from "@/server/catalog-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const authorization = await authorizeAdminRead("catalog:read");
  if (authorization.response) return authorization.response;
  const csv = buildCatalogCsv(await listAdminProducts());
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition":
        'attachment; filename="catalogo-farmacia-picual.csv"',
      "cache-control": "private, no-store, max-age=0",
    },
  });
}
