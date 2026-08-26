import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminOperation } from "@/server/admin-audit";
import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { refundShopifyOrder } from "@/server/shopify/orders";

export const dynamic = "force-dynamic";

const refundSchema = z.object({
  confirmed: z.literal(true),
  operationId: z.string().uuid(),
  confirmation: z.string().trim().min(2).max(64),
  note: z.string().trim().min(10).max(255),
  notifyCustomer: z.boolean(),
  restock: z.boolean(),
  lines: z
    .array(
      z.object({
        lineItemId: z.string().regex(/^gid:\/\/shopify\/LineItem\/\d+$/),
        quantity: z.number().int().positive().max(1_000),
      }),
    )
    .min(1)
    .max(100),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "orders:refund",
    rateLimit: ADMIN_RATE_LIMITS.refund,
  });
  if (authorization.response) return authorization.response;
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Pedido no válido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await readLimitedJsonBody(request, 12 * 1024);
  } catch (error) {
    return (
      requestBodyErrorResponse(error) ??
      NextResponse.json(
        { error: "No se pudo leer la petición." },
        { status: 400 },
      )
    );
  }
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Revisa las cantidades, la nota y la confirmación del reembolso.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await refundShopifyOrder(id, parsed.data);
    const auditWritten = await recordAdminOperation({
      actor: authorization.actor,
      action: "order.refund_created",
      resourceType: "shopify_order",
      resourceId: id,
      metadata: {
        operationId: parsed.data.operationId,
        refundId: result.id,
        amount: result.amount,
        currencyCode: result.currencyCode,
        transactionStatus: result.transactionStatus,
        notifyCustomer: parsed.data.notifyCustomer,
        restock: parsed.data.restock,
        lineCount: parsed.data.lines.length,
        unitCount: parsed.data.lines.reduce(
          (total, line) => total + line.quantity,
          0,
        ),
      },
    });
    if (!auditWritten) {
      console.error(
        "El reembolso se completó, pero no pudo persistirse su auditoría.",
      );
    }
    return NextResponse.json(
      { result },
      { status: result.transactionStatus === "SUCCESS" ? 201 : 202 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo procesar el reembolso.",
      },
      { status: 409 },
    );
  }
}
