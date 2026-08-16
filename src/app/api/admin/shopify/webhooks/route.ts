import { NextResponse } from "next/server";

import { getAdminActor, isSameOriginRequest } from "@/server/admin-auth";
import { adminMutationRateLimitResponse } from "@/server/admin-security";
import { ensureShopifyWebhookSubscriptions } from "@/server/shopify/webhook-subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  const rateLimited = adminMutationRateLimitResponse(actor.userId);
  if (rateLimited) return rateLimited;

  try {
    return NextResponse.json({
      webhooks: await ensureShopifyWebhookSubscriptions(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron activar los webhooks.",
      },
      { status: 409 },
    );
  }
}
