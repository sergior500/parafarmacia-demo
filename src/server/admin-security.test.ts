import { describe, expect, it } from "vitest";

import { consumeRateLimit } from "@/server/admin-security";

describe("consumeRateLimit", () => {
  it("bloquea el exceso y permite de nuevo tras la ventana", () => {
    const store = new Map();
    expect(
      consumeRateLimit(store, "admin", {
        limit: 2,
        windowMs: 1_000,
        now: 0,
      }).allowed,
    ).toBe(true);
    expect(
      consumeRateLimit(store, "admin", {
        limit: 2,
        windowMs: 1_000,
        now: 1,
      }).allowed,
    ).toBe(true);
    expect(
      consumeRateLimit(store, "admin", {
        limit: 2,
        windowMs: 1_000,
        now: 2,
      }),
    ).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(
      consumeRateLimit(store, "admin", {
        limit: 2,
        windowMs: 1_000,
        now: 1_000,
      }).allowed,
    ).toBe(true);
  });
});
