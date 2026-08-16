import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminOperation } from "@/server/admin-audit";
import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { fulfillShopifyOrder } from "@/server/shopify/orders";

export const dynamic = "force-dynamic";

const fulfillmentSchema = z.object({
  confirmed: z.literal(true),
  operationId: z.string().uuid(),
  notifyCustomer: z.boolean(),
  trackingCompany: z.string().trim().max(100).optional().default(""),
  trackingNumber: z.string().trim().max(100).optional().default(""),
  trackingUrl: z
    .union([z.literal(""), z.string().trim().url().max(2_048)])
    .optional()
    .default(""),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "orders:fulfill",
    rateLimit: ADMIN_RATE_LIMITS.fulfillment,
  });
  if (authorization.response) return authorization.response;
  const { actor } = authorization;
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Pedido no válido." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await readLimitedJsonBody(request, 8 * 1024);
  } catch (error) {
    return (
      requestBodyErrorResponse(error) ??
      NextResponse.json(
        { error: "No se pudo leer la petición." },
        { status: 400 },
      )
    );
  }
  const parsed = fulfillmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Revisa los datos del envío y confirma que el pedido está preparado.",
      },
      { status: 400 },
    );
  }
  try {
    const result = await fulfillShopifyOrder(id, parsed.data);
    await recordAdminOperation({
      actor,
      action: "order.fulfilled",
      resourceType: "shopify_order",
      resourceId: id,
      metadata: {
        fulfillments: result.completed.length,
        notifyCustomer: parsed.data.notifyCustomer,
        hasTracking: Boolean(parsed.data.trackingNumber),
      },
    });
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el envío.",
      },
      { status: 409 },
    );
  }
}
