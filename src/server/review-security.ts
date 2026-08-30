import { env } from "cloudflare:workers";

import { consumeRateLimit, type RateWindow } from "@/server/rate-limit";
import { sha256Base64Url } from "@/server/shopify/customer-account-security";

const localWindows = new Map<string, RateWindow>();
const REVIEW_LIMIT = 5;
const REVIEW_WINDOW_MS = 60 * 60 * 1000;

export async function reviewRateLimitResponse(
  request: Request,
  sessionId: string,
): Promise<Response | null> {
  const network =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ||
    "unknown";
  const rateKey = await sha256Base64Url(`review|${network}|${sessionId}`);
  const now = Date.now();

  const result =
    process.env.NODE_ENV === "production"
      ? await consumeDurableReviewLimit(rateKey, now).catch(() => null)
      : consumeRateLimit(localWindows, rateKey, {
          limit: REVIEW_LIMIT,
          windowMs: REVIEW_WINDOW_MS,
        });
  if (!result) {
    return Response.json(
      { error: "La protección contra abuso no está disponible." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (result.allowed) return null;
  return Response.json(
    { error: "Has enviado demasiadas opiniones. Inténtalo más tarde." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}

async function consumeDurableReviewLimit(rateKey: string, now: number) {
  const bindings = env as unknown as { DB?: D1Database };
  if (!bindings.DB) throw new Error("D1 no está disponible.");
  const resetAt = now + REVIEW_WINDOW_MS;
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
     RETURNING count, reset_at`,
  )
    .bind(`review:${rateKey}`, resetAt, now)
    .first<{ count: number; reset_at: number }>();
  if (!row) throw new Error("No se pudo aplicar el límite.");
  return {
    allowed: row.count <= REVIEW_LIMIT,
    retryAfterSeconds:
      row.count <= REVIEW_LIMIT
        ? 0
        : Math.max(1, Math.ceil((row.reset_at - now) / 1000)),
  };
}
