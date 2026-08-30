import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { productReviewSubmissionSchema } from "@/domain/review/review";
import { isSameOriginRequest } from "@/server/admin-auth";
import { findAdminProduct } from "@/server/catalog-repository";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { hasVerifiedProductPurchase } from "@/server/review-policy";
import {
  createProductReview,
  hasCustomerProductReview,
} from "@/server/review-repository";
import { reviewRateLimitResponse } from "@/server/review-security";
import { getCustomerAccountProfile } from "@/server/shopify/customer-account-api";
import { sha256Base64Url } from "@/server/shopify/customer-account-security";
import {
  customerSessionCookieName,
  readCustomerSession,
} from "@/server/shopify/customer-account-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  }

  const sessionId = (await cookies()).get(customerSessionCookieName())?.value;
  const session = await readCustomerSession(sessionId).catch(() => null);
  if (!session || !sessionId) {
    return NextResponse.json(
      { error: "Inicia sesión para publicar una opinión." },
      { status: 401 },
    );
  }
  const rateLimited = await reviewRateLimitResponse(request, sessionId);
  if (rateLimited) return rateLimited;

  try {
    const parsed = productReviewSubmissionSchema.safeParse(
      await readLimitedJsonBody(request, 8 * 1024),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "La opinión no es válida.",
        },
        { status: 400 },
      );
    }

    const product = await findAdminProduct(parsed.data.productId);
    if (!product || product.status === "withdrawn") {
      return NextResponse.json(
        { error: "El producto ya no está disponible." },
        { status: 404 },
      );
    }

    const profile = await getCustomerAccountProfile(session.accessToken);
    if (!hasVerifiedProductPurchase(profile, product)) {
      return NextResponse.json(
        {
          error:
            "Solo se pueden publicar opiniones de productos comprados con esta cuenta.",
        },
        { status: 403 },
      );
    }

    const customerIdHash = await sha256Base64Url(profile.id);
    if (await hasCustomerProductReview(product.id, customerIdHash)) {
      return NextResponse.json(
        { error: "Ya has enviado una opinión para este producto." },
        { status: 409 },
      );
    }

    await createProductReview(parsed.data, customerIdHash);
    return NextResponse.json(
      {
        message:
          "Opinión recibida. Se publicará cuando el equipo compruebe que cumple los criterios.",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    const message =
      error instanceof Error && /unique|constraint/i.test(error.message)
        ? "Ya has enviado una opinión para este producto."
        : error instanceof Error
          ? error.message
          : "No se pudo guardar la opinión.";
    return NextResponse.json(
      { error: message },
      { status: /Ya has enviado/.test(message) ? 409 : 502 },
    );
  }
}
