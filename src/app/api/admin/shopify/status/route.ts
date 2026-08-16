import { NextResponse } from "next/server";

import { getAdminActor } from "@/server/admin-auth";
import { getCatalogHealth } from "@/server/catalog-repository";
import { testShopifyConnection } from "@/server/shopify/admin-api";
import { getPublicShopifyStatus } from "@/server/shopify/config";
import { getShopifyWebhookStatus } from "@/server/shopify/webhook-subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getAdminActor();
  if (!actor)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const configuration = getPublicShopifyStatus();
  let connection:
    | (Awaited<ReturnType<typeof testShopifyConnection>> & { connected: true })
    | { connected: false; error: string }
    | null = null;
  let webhooks:
    | (Awaited<ReturnType<typeof getShopifyWebhookStatus>> & { error?: never })
    | { ready: false; error: string }
    | null = null;

  if (configuration.configured) {
    try {
      connection = { connected: true, ...(await testShopifyConnection()) };
      try {
        webhooks = await getShopifyWebhookStatus();
      } catch (error) {
        webhooks = {
          ready: false,
          error:
            error instanceof Error
              ? error.message
              : "No se pudieron comprobar los webhooks.",
        };
      }
    } catch (error) {
      connection = {
        connected: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo comprobar Shopify.",
      };
    }
  }

  return NextResponse.json({
    configuration,
    connection,
    webhooks,
    catalog: await getCatalogHealth(),
  });
}
