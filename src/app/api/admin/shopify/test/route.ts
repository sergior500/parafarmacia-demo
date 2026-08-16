import { NextResponse } from "next/server";

import { getAdminActor, isSameOriginRequest } from "@/server/admin-auth";
import { adminMutationRateLimitResponse } from "@/server/admin-security";
import { testShopifyConnection } from "@/server/shopify/admin-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  }
  const rateLimited = adminMutationRateLimitResponse(actor.userId);
  if (rateLimited) return rateLimited;

  try {
    return NextResponse.json({
      connection: { connected: true, ...(await testShopifyConnection()) },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo comprobar Shopify.",
      },
      { status: 409 },
    );
  }
}
