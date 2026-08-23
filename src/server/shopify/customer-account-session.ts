import { getDb } from "@db/index";
import { customerSessions } from "@db/schema";
import { eq, lt } from "drizzle-orm";

import {
  decryptCustomerSecret,
  encryptCustomerSecret,
  randomBase64Url,
  sha256Base64Url,
} from "@/server/shopify/customer-account-security";

export const CUSTOMER_SESSION_COOKIE = "__Host-picual_customer_session";
export const CUSTOMER_OAUTH_COOKIE = "__Host-picual_customer_oauth";
const LOCAL_SESSION_COOKIE = "picual_customer_session";
const LOCAL_OAUTH_COOKIE = "picual_customer_oauth";

export interface CustomerTokenSet {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface CustomerSessionTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export function customerSessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? CUSTOMER_SESSION_COOKIE
    : LOCAL_SESSION_COOKIE;
}

export function customerOAuthCookieName() {
  return process.env.NODE_ENV === "production"
    ? CUSTOMER_OAUTH_COOKIE
    : LOCAL_OAUTH_COOKIE;
}

export function secureCustomerCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createCustomerSession(
  tokens: CustomerTokenSet,
): Promise<{ sessionId: string; expiresAt: number }> {
  const now = Date.now();
  const expiresAt = now + Math.max(60, tokens.expiresIn) * 1000;
  const sessionId = randomBase64Url(32);
  const sessionIdHash = await sha256Base64Url(sessionId);
  await getDb()
    .delete(customerSessions)
    .where(lt(customerSessions.expiresAt, now));
  await getDb()
    .insert(customerSessions)
    .values({
      sessionIdHash,
      accessTokenCiphertext: await encryptCustomerSecret(tokens.accessToken),
      idTokenCiphertext: await encryptCustomerSecret(tokens.idToken),
      refreshTokenCiphertext: tokens.refreshToken
        ? await encryptCustomerSecret(tokens.refreshToken)
        : null,
      expiresAt,
      createdAt: now,
      lastSeenAt: now,
    });
  return { sessionId, expiresAt };
}

export async function readCustomerSession(
  sessionId: string | undefined,
): Promise<CustomerSessionTokens | null> {
  if (!sessionId || sessionId.length > 256) return null;
  const sessionIdHash = await sha256Base64Url(sessionId);
  const rows = await getDb()
    .select()
    .from(customerSessions)
    .where(eq(customerSessions.sessionIdHash, sessionIdHash))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    await getDb()
      .delete(customerSessions)
      .where(eq(customerSessions.sessionIdHash, sessionIdHash));
    return null;
  }
  const [accessToken, idToken, refreshToken] = await Promise.all([
    decryptCustomerSecret(row.accessTokenCiphertext),
    decryptCustomerSecret(row.idTokenCiphertext),
    row.refreshTokenCiphertext
      ? decryptCustomerSecret(row.refreshTokenCiphertext)
      : Promise.resolve(null),
  ]);
  if (!accessToken || !idToken) return null;
  if (Date.now() - row.lastSeenAt > 5 * 60 * 1000) {
    await getDb()
      .update(customerSessions)
      .set({ lastSeenAt: Date.now() })
      .where(eq(customerSessions.sessionIdHash, sessionIdHash));
  }
  return {
    accessToken,
    idToken,
    refreshToken: refreshToken ?? undefined,
    expiresAt: row.expiresAt,
  };
}

export async function deleteCustomerSession(sessionId: string | undefined) {
  if (!sessionId || sessionId.length > 256) return;
  await getDb()
    .delete(customerSessions)
    .where(
      eq(customerSessions.sessionIdHash, await sha256Base64Url(sessionId)),
    );
}
