import { NextResponse } from "next/server";

import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import { testShopifyConnection } from "@/server/shopify/admin-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "shopify:manage",
    rateLimit: ADMIN_RATE_LIMITS.shopifyManage,
  });
  if (authorization.response) return authorization.response;

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
