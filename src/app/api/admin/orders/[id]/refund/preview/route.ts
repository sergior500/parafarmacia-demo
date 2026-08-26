import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { suggestShopifyOrderRefund } from "@/server/shopify/orders";

export const dynamic = "force-dynamic";

const previewSchema = z.object({
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
    rateLimit: ADMIN_RATE_LIMITS.refundPreview,
  });
  if (authorization.response) return authorization.response;
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Pedido no válido." }, { status: 400 });
  }

  try {
    const parsed = previewSchema.safeParse(
      await readLimitedJsonBody(request, 8 * 1024),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Selecciona cantidades válidas." },
        { status: 400 },
      );
    }
    const suggestion = await suggestShopifyOrderRefund(id, parsed.data.lines);
    return NextResponse.json({ suggestion });
  } catch (error) {
    const requestError = requestBodyErrorResponse(error);
    if (requestError) return requestError;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo calcular el reembolso.",
      },
      { status: 409 },
    );
  }
}
