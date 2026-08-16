interface RateWindow {
  count: number;
  resetAt: number;
}

const mutationWindows = new Map<string, RateWindow>();

export function consumeRateLimit(
  store: Map<string, RateWindow>,
  key: string,
  options: { limit: number; windowMs: number; now?: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = options.now ?? Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function adminMutationRateLimitResponse(
  actorId: string,
): Response | null {
  const result = consumeRateLimit(mutationWindows, actorId, {
    limit: 30,
    windowMs: 60_000,
  });
  if (result.allowed) return null;
  return Response.json(
    { error: "Demasiadas operaciones. Espera unos segundos." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}
