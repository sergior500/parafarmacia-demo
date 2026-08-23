import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  exchangeCustomerAuthorizationCode,
  ShopifyCustomerAccountError,
} from "@/server/shopify/customer-account-api";
import { getShopifyCustomerAccountConfiguration } from "@/server/shopify/customer-account-config";
import {
  constantTimeEqual,
  decodeOAuthAttempt,
  validateIdTokenClaims,
} from "@/server/shopify/customer-account-security";
import { customerAuthRateLimitExceeded } from "@/server/shopify/customer-account-rate-limit";
import {
  createCustomerSession,
  customerOAuthCookieName,
  customerSessionCookieName,
  secureCustomerCookieOptions,
} from "@/server/shopify/customer-account-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  if (await customerAuthRateLimitExceeded(request, "callback")) {
    return callbackFailure(requestUrl, customerOAuthCookieName(), "limite");
  }
  const cookieStore = await cookies();
  const oauthCookieName = customerOAuthCookieName();
  const attempt = await decodeOAuthAttempt(
    cookieStore.get(oauthCookieName)?.value,
  );
  const code = requestUrl.searchParams.get("code")?.trim();
  const state = requestUrl.searchParams.get("state")?.trim();
  const oauthError = requestUrl.searchParams.get("error")?.trim();

  if (
    oauthError ||
    !attempt ||
    !code ||
    code.length > 4_096 ||
    !state ||
    state.length > 512 ||
    !constantTimeEqual(state, attempt.state)
  ) {
    return callbackFailure(requestUrl, oauthCookieName, "no-validado");
  }

  try {
    const tokens = await exchangeCustomerAuthorizationCode(
      code,
      attempt.verifier,
    );
    const configuration = getShopifyCustomerAccountConfiguration();
    if (
      !configuration.clientId ||
      !validateIdTokenClaims(tokens.idToken, {
        nonce: attempt.nonce,
        clientId: configuration.clientId,
      })
    ) {
      return callbackFailure(requestUrl, oauthCookieName, "no-validado");
    }
    const session = await createCustomerSession(tokens);
    const response = NextResponse.redirect(
      new URL(attempt.returnTo, configuration.siteOrigin ?? requestUrl.origin),
      303,
    );
    response.cookies.delete(oauthCookieName);
    response.cookies.set(
      customerSessionCookieName(),
      session.sessionId,
      secureCustomerCookieOptions(
        Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000)),
      ),
    );
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    const reason =
      error instanceof ShopifyCustomerAccountError &&
      error.reason === "configuration"
        ? "no-configurado"
        : "fallo";
    return callbackFailure(requestUrl, oauthCookieName, reason);
  }
}

function callbackFailure(
  requestUrl: URL,
  oauthCookieName: string,
  reason: string,
) {
  const response = NextResponse.redirect(
    new URL(
      `/cuenta?acceso=${encodeURIComponent(reason)}`,
      getShopifyCustomerAccountConfiguration().siteOrigin ?? requestUrl.origin,
    ),
    303,
  );
  response.cookies.delete(oauthCookieName);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
