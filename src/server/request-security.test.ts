import { describe, expect, it } from "vitest";

import {
  readLimitedJsonBody,
  RequestBodyError,
} from "@/server/request-security";

describe("readLimitedJsonBody", () => {
  it("acepta JSON dentro del límite", async () => {
    const value = await readLimitedJsonBody(
      new Request("https://example.com/api", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: '{"ok":true}',
      }),
      100,
    );
    expect(value).toEqual({ ok: true });
  });

  it("rechaza tipos de contenido inesperados", async () => {
    await expect(
      readLimitedJsonBody(
        new Request("https://example.com/api", {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: "{}",
        }),
      ),
    ).rejects.toMatchObject({ status: 415 } satisfies Partial<RequestBodyError>);
  });

  it("rechaza cuerpos que superan el límite real", async () => {
    await expect(
      readLimitedJsonBody(
        new Request("https://example.com/api", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value: "x".repeat(100) }),
        }),
        20,
      ),
    ).rejects.toMatchObject({ status: 413 } satisfies Partial<RequestBodyError>);
  });
});
