import { getDb } from "@db/index";
import { shopifyWebhookReceipts } from "@db/schema";
import { NextResponse } from "next/server";

import { getShopifyConfiguration } from "@/server/shopify/config";
import { verifyShopifyWebhook } from "@/server/shopify/webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const config = getShopifyConfiguration();
  if (!config.webhookSecret) {
    return NextResponse.json({ error: "Webhooks no configurados." }, { status: 503 });
  }
  const valid = await verifyShopifyWebhook(
    body,
    request.headers.get("x-shopify-hmac-sha256"),
    config.webhookSecret,
  );
  if (!valid) return NextResponse.json({ error: "Firma no válida." }, { status: 401 });

  const webhookId = request.headers.get("x-shopify-webhook-id")?.trim();
  const topic = request.headers.get("x-shopify-topic")?.trim();
  const shopDomain = request.headers.get("x-shopify-shop-domain")?.trim();
  if (!webhookId || !topic || !shopDomain) {
    return NextResponse.json({ error: "Cabeceras incompletas." }, { status: 400 });
  }

  let resourceId: string | null = null;
  try {
    const payload = JSON.parse(body) as { id?: string | number };
    resourceId = payload.id === undefined ? null : String(payload.id);
  } catch {
    return NextResponse.json({ error: "JSON no válido." }, { status: 400 });
  }

  await getDb()
    .insert(shopifyWebhookReceipts)
    .values({
      webhookId,
      topic,
      shopDomain,
      resourceId,
      status: "received",
    })
    .onConflictDoNothing();

  return new NextResponse(null, { status: 204 });
}
