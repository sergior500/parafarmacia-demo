export interface RateWindow {
  count: number;
  resetAt: number;
}

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
