const BASE_CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
] as const;

export function applySecurityHeaders(
  request: Request,
  response: Response,
  options: { production?: boolean } = {},
): Response {
  const url = new URL(request.url);
  const production =
    options.production ?? process.env.NODE_ENV === "production";
  const headers = new Headers(response.headers);
  const nonce = request.headers.get("x-picual-csp-nonce");
  const strictAdminPolicy =
    production && url.pathname.startsWith("/admin") && nonce;
  const scriptPolicy = strictAdminPolicy
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : production
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const directives = [
    ...BASE_CSP_DIRECTIVES,
    scriptPolicy,
    "script-src-attr 'none'",
  ];
  if (production && url.protocol === "https:") {
    directives.push("upgrade-insecure-requests");
    headers.set("Strict-Transport-Security", "max-age=63072000");
  }

  headers.set("Content-Security-Policy", `${directives.join("; ")};`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Origin-Agent-Cluster", "?1");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Download-Options", "noopen");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set(
    "X-Request-ID",
    request.headers.get("x-picual-request-id") ?? crypto.randomUUID(),
  );

  if (url.pathname.startsWith("/admin")) {
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  } else if (url.pathname.startsWith("/api/")) {
    headers.set("Cache-Control", "no-store, max-age=0");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
