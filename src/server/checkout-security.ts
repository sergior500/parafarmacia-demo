import { consumeRateLimit } from "@/server/admin-security";

const checkoutWindows = new Map<string, { count: number; resetAt: number }>();

export function getCheckoutClientIp(request: Request): string | undefined {
  const candidate =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  return candidate && /^[0-9a-f:.]{3,45}$/i.test(candidate)
    ? candidate
    : undefined;
}

export function checkoutRateLimitResponse(request: Request): Response | null {
  const clientKey = getCheckoutClientIp(request) || "anonymous";
  const result = consumeRateLimit(checkoutWindows, clientKey, {
    limit: 10,
    windowMs: 60_000,
  });
  if (result.allowed) return null;
  return Response.json(
    { error: "Demasiados intentos de pago. Espera unos segundos." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}
