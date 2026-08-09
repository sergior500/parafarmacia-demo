import { NextResponse } from "next/server";

import { getAdminActor } from "@/server/admin-auth";
import { getCatalogHealth } from "@/server/catalog-repository";
import { getPublicShopifyStatus } from "@/server/shopify/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  return NextResponse.json({
    configuration: getPublicShopifyStatus(),
    catalog: await getCatalogHealth(),
  });
}
