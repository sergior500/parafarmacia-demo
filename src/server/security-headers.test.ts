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
    expect(response.headers.get("content-security-policy")).toContain(
      "script-src-attr 'none'",
    );
    expect(response.headers.get("cross-origin-resource-policy")).toBe(
      "same-origin",
    );
    expect(response.headers.get("x-request-id")).toBeTruthy();
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

  it("elimina unsafe-inline del panel cuando el worker aporta un nonce", () => {
    const response = applySecurityHeaders(
      new Request("https://example.com/admin/productos", {
        headers: { "x-picual-csp-nonce": "abc123" },
      }),
      new Response("ok"),
      { production: true },
    );
    const policy = response.headers.get("content-security-policy") ?? "";
    const scriptDirective =
      policy
        .split(";")
        .find((directive) => directive.trim().startsWith("script-src ")) ?? "";
    expect(policy).toContain("'nonce-abc123'");
    expect(policy).toContain("'strict-dynamic'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
  });
});
