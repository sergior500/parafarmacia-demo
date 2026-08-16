import { getDb } from "@db/index";
import { shopifyWebhookReceipts } from "@db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  readLimitedTextBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { getShopifyConfiguration } from "@/server/shopify/config";
import { processShopifyWebhook } from "@/server/shopify/webhook-processor";
import {
  getShopifyWebhookResourceId,
  SUPPORTED_SHOPIFY_WEBHOOK_TOPICS,
  verifyShopifyWebhook,
} from "@/server/shopify/webhooks";

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
    !SUPPORTED_SHOPIFY_WEBHOOK_TOPICS.has(topic) ||
    shopDomain !== config.storeDomain
  ) {
    return NextResponse.json(
      { error: "Cabeceras no permitidas." },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "JSON no válido." }, { status: 400 });
  }

  const db = getDb();
  await db
    .insert(shopifyWebhookReceipts)
    .values({
      webhookId,
      topic,
      shopDomain,
      resourceId: getShopifyWebhookResourceId(topic, payload),
      status: "received",
    })
    .onConflictDoNothing();

  const receipts = await db
    .select({ status: shopifyWebhookReceipts.status })
    .from(shopifyWebhookReceipts)
    .where(eq(shopifyWebhookReceipts.webhookId, webhookId))
    .limit(1);
  if (receipts[0]?.status === "processed") {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await processShopifyWebhook(topic, payload);
    await db
      .update(shopifyWebhookReceipts)
      .set({
        status: "processed",
        error: null,
        processedAt: new Date().toISOString(),
      })
      .where(eq(shopifyWebhookReceipts.webhookId, webhookId));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo procesar el webhook.";
    await db
      .update(shopifyWebhookReceipts)
      .set({ status: "error", error: message.slice(0, 500) })
      .where(eq(shopifyWebhookReceipts.webhookId, webhookId));
    return NextResponse.json(
      { error: "No se pudo procesar el webhook." },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
