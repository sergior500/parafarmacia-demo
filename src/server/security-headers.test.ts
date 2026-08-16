import { describe, expect, it } from "vitest";

import { applySecurityHeaders } from "@/server/security-headers";

describe("applySecurityHeaders", () => {
  it("añade defensas del navegador y evita cachear el panel", () => {
    const response = applySecurityHeaders(
      new Request("https://example.com/admin/pedidos"),
      new Response("ok", { headers: { "content-type": "text/html" } }),
      { production: true },
    );

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("strict-transport-security")).toBeTruthy();
  });

  it("no fuerza HSTS durante desarrollo HTTP", () => {
    const response = applySecurityHeaders(
      new Request("http://localhost:3000/"),
      new Response("ok"),
      { production: false },
    );
    expect(response.headers.has("strict-transport-security")).toBe(false);
    expect(response.headers.get("content-security-policy")).toContain(
      "'unsafe-eval'",
    );
  });
});
