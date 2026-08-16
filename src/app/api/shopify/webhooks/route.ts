import { getDb } from "@db/index";
import { shopifyWebhookReceipts } from "@db/schema";
import { NextResponse } from "next/server";

import {
  readLimitedTextBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { getShopifyConfiguration } from "@/server/shopify/config";
import { verifyShopifyWebhook } from "@/server/shopify/webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = getShopifyConfiguration();
  if (!config.webhookSecret || !config.storeDomain) {
    return NextResponse.json(
      { error: "Webhooks no configurados." },
      { status: 503 },
    );
  }
  let body: string;
  try {
    body = await readLimitedTextBody(request, {
      maxBytes: 1024 * 1024,
      contentTypes: ["application/json"],
    });
  } catch (error) {
    return (
      requestBodyErrorResponse(error) ??
      NextResponse.json(
        { error: "No se pudo leer el webhook." },
        { status: 400 },
      )
    );
  }
  const valid = await verifyShopifyWebhook(
    body,
    request.headers.get("x-shopify-hmac-sha256"),
    config.webhookSecret,
  );
  if (!valid) {
    return NextResponse.json({ error: "Firma no válida." }, { status: 401 });
  }

  const webhookId = request.headers.get("x-shopify-webhook-id")?.trim();
  const topic = request.headers.get("x-shopify-topic")?.trim();
  const shopDomain = request.headers.get("x-shopify-shop-domain")?.trim();
  if (
    !webhookId ||
    !/^[A-Za-z0-9._:-]{1,128}$/.test(webhookId) ||
    !topic ||
    !/^[a-z0-9_/-]{1,128}$/.test(topic) ||
    shopDomain !== config.storeDomain
  ) {
    return NextResponse.json(
      { error: "Cabeceras no permitidas." },
      { status: 403 },
    );
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
