import { env } from "cloudflare:workers";

import { consumeRateLimit, type RateWindow } from "@/server/rate-limit";
import { sha256Base64Url } from "@/server/shopify/customer-account-security";

const localWindows = new Map<string, RateWindow>();

export async function customerAuthRateLimitExceeded(
  request: Request,
  scope: "login" | "callback",
): Promise<boolean> {
  const policy =
    scope === "login"
      ? { limit: 10, windowMs: 10 * 60_000 }
      : { limit: 20, windowMs: 10 * 60_000 };
  const network = request.headers.get("cf-connecting-ip")?.trim() || "unknown";
  const key = await sha256Base64Url(`customer-auth|${scope}|${network}`);
  if (process.env.NODE_ENV !== "production") {
    return !consumeRateLimit(localWindows, key, policy).allowed;
  }
  try {
    const bindings = env as unknown as { DB?: D1Database };
    if (!bindings.DB) return true;
    const now = Date.now();
    const row = await bindings.DB.prepare(
      `INSERT INTO admin_rate_limits (rate_key, count, reset_at, updated_at)
       VALUES (?, 1, ?, ?)
       ON CONFLICT(rate_key) DO UPDATE SET
         count = CASE
           WHEN admin_rate_limits.reset_at <= excluded.updated_at THEN 1
           ELSE admin_rate_limits.count + 1
         END,
         reset_at = CASE
           WHEN admin_rate_limits.reset_at <= excluded.updated_at THEN excluded.reset_at
           ELSE admin_rate_limits.reset_at
         END,
         updated_at = excluded.updated_at
       RETURNING count`,
    )
      .bind(key, now + policy.windowMs, now)
      .first<{ count: number }>();
    return !row || row.count > policy.limit;
  } catch {
    return true;
  }
}
