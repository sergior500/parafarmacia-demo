import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminOperation } from "@/server/admin-audit";
import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import {
  cancelShopifyOrder,
  SHOPIFY_ORDER_CANCEL_REASONS,
} from "@/server/shopify/orders";

export const dynamic = "force-dynamic";

const cancellationSchema = z.object({
  confirmed: z.literal(true),
  operationId: z.string().uuid(),
  confirmation: z.string().trim().min(2).max(64),
  reason: z.enum(SHOPIFY_ORDER_CANCEL_REASONS),
  staffNote: z.string().trim().min(10).max(255),
  notifyCustomer: z.boolean(),
  restock: z.boolean(),
  refundOriginalPaymentMethods: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "orders:cancel",
    rateLimit: ADMIN_RATE_LIMITS.cancellation,
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
  const parsed = cancellationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Revisa el motivo, la nota interna y la confirmación de cancelación.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await cancelShopifyOrder(id, parsed.data);
    await recordAdminOperation({
      actor,
      action: result.alreadyCancelled
        ? "order.cancellation_already_applied"
        : "order.cancellation_requested",
      resourceType: "shopify_order",
      resourceId: id,
      metadata: {
        operationId: parsed.data.operationId,
        reason: parsed.data.reason,
        notifyCustomer: parsed.data.notifyCustomer,
        restock: parsed.data.restock,
        refundOriginalPaymentMethods: parsed.data.refundOriginalPaymentMethods,
        jobId: result.job?.id,
        jobDone: result.job?.done,
      },
    });
    return NextResponse.json(
      { result },
      { status: result.job && !result.job.done ? 202 : 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cancelar el pedido.",
      },
      { status: 409 },
    );
  }
}
