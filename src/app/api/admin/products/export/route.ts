import { NextResponse } from "next/server";

import { getAdminActor } from "@/server/admin-auth";
import { buildCatalogCsv } from "@/server/catalog-csv";
import { listAdminProducts } from "@/server/catalog-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
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
