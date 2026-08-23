import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isSameOriginRequest } from "@/server/admin-auth";
import { createCustomerLogoutUrl } from "@/server/shopify/customer-account-api";
import { getShopifyCustomerAccountConfiguration } from "@/server/shopify/customer-account-config";
import {
  customerSessionCookieName,
  deleteCustomerSession,
  readCustomerSession,
} from "@/server/shopify/customer-account-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Petición no autorizada." },
      { status: 403 },
    );
  }
  const cookieStore = await cookies();
  const cookieName = customerSessionCookieName();
  const sessionId = cookieStore.get(cookieName)?.value;
  const session = await readCustomerSession(sessionId).catch(() => null);
  await deleteCustomerSession(sessionId).catch(() => undefined);

  let destination = new URL(
    "/cuenta?sesion=cerrada",
    getShopifyCustomerAccountConfiguration().siteOrigin ?? request.url,
  );
  if (session?.idToken) {
    destination = await createCustomerLogoutUrl(session.idToken).catch(
      () => destination,
    );
  }
  const response = NextResponse.redirect(destination, 303);
  response.cookies.delete(cookieName);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
