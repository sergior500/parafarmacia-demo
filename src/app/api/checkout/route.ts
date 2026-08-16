import { NextResponse } from "next/server";

import { isSameOriginRequest } from "@/server/admin-auth";
import {
  checkoutRateLimitResponse,
  getCheckoutClientIp,
} from "@/server/checkout-security";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { checkoutRequestSchema } from "@/server/shopify/checkout-contract";
import {
  createShopifyCheckout,
  ShopifyCheckoutError,
} from "@/server/shopify/storefront";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  const rateLimited = checkoutRateLimitResponse(request);
  if (rateLimited) return rateLimited;

  try {
    const parsed = checkoutRequestSchema.safeParse(
      await readLimitedJsonBody(request, 16 * 1024),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "El carrito no es válido." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      await createShopifyCheckout(parsed.data, getCheckoutClientIp(request)),
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo preparar el pago seguro.",
      },
      { status: error instanceof ShopifyCheckoutError ? 409 : 502 },
    );
  }
}
