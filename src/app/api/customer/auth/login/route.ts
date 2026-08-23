import { NextResponse } from "next/server";

import { createCustomerAuthorization } from "@/server/shopify/customer-account-api";
import { getShopifyCustomerAccountConfiguration } from "@/server/shopify/customer-account-config";
import { customerAuthRateLimitExceeded } from "@/server/shopify/customer-account-rate-limit";
import {
  encodeOAuthAttempt,
  safeCustomerReturnPath,
} from "@/server/shopify/customer-account-security";
import {
  customerOAuthCookieName,
  secureCustomerCookieOptions,
} from "@/server/shopify/customer-account-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (await customerAuthRateLimitExceeded(request, "login")) {
    return NextResponse.redirect(
      new URL("/cuenta?acceso=limite", request.url),
      303,
    );
  }
  try {
    const { authorizationUrl, attempt } = await createCustomerAuthorization();
    attempt.returnTo = safeCustomerReturnPath(
      new URL(request.url).searchParams.get("return_to"),
    );
    const response = NextResponse.redirect(authorizationUrl, 303);
    response.cookies.set(
      customerOAuthCookieName(),
      await encodeOAuthAttempt(attempt),
      secureCustomerCookieOptions(10 * 60),
    );
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    const origin =
      getShopifyCustomerAccountConfiguration().siteOrigin ??
      new URL(request.url).origin;
    return NextResponse.redirect(
      new URL("/cuenta?acceso=no-configurado", origin),
      303,
    );
  }
}
