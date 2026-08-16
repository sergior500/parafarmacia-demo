import { describe, expect, it } from "vitest";

import { issueAdminCsrfToken, verifyAdminCsrfToken } from "@/server/admin-csrf";

const secret = "test-only-secret-with-at-least-thirty-two-characters";
const actor = { userId: "user-123" };
const origin = "https://farmacia.example";

describe("admin CSRF tokens", () => {
  it("acepta un token firmado para el usuario y origen correctos", async () => {
    const { token } = await issueAdminCsrfToken(actor, origin, {
      now: 1_000_000,
      secret,
    });
    await expect(
      verifyAdminCsrfToken(token, actor, origin, {
        now: 1_001_000,
        secret,
      }),
    ).resolves.toBe(true);
  });

  it("rechaza manipulación, otro usuario y otro origen", async () => {
    const { token } = await issueAdminCsrfToken(actor, origin, {
      now: 1_000_000,
      secret,
    });
    await expect(
      verifyAdminCsrfToken(`${token.slice(0, -1)}x`, actor, origin, {
        now: 1_001_000,
        secret,
      }),
    ).resolves.toBe(false);
    await expect(
      verifyAdminCsrfToken(token, { userId: "other" }, origin, {
        now: 1_001_000,
        secret,
      }),
    ).resolves.toBe(false);
    await expect(
      verifyAdminCsrfToken(token, actor, "https://evil.example", {
        now: 1_001_000,
        secret,
      }),
    ).resolves.toBe(false);
  });

  it("rechaza tokens caducados", async () => {
    const { token } = await issueAdminCsrfToken(actor, origin, {
      now: 1_000_000,
      secret,
    });
    await expect(
      verifyAdminCsrfToken(token, actor, origin, {
        now: 1_000_000 + 11 * 60_000,
        secret,
      }),
    ).resolves.toBe(false);
  });
});
