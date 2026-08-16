import handler from "vinext/server/app-router-entry";
import {
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
  handleImageOptimization,
} from "vinext/server/image-optimization";

import { applySecurityHeaders } from "../src/server/security-headers";

interface Env {
  ASSETS?: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: {
          format: string;
          quality: number;
        }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const incomingUrl = new URL(request.url);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-picual-request-id", crypto.randomUUID());
    if (incomingUrl.pathname.startsWith("/admin")) {
      const nonce = crypto.randomUUID().replace(/-/g, "");
      requestHeaders.set("x-picual-csp-nonce", nonce);
      requestHeaders.set(
        "content-security-policy",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      );
    }
    const trustedRequest = new Request(request, { headers: requestHeaders });
    const url = new URL(trustedRequest.url);

    if (url.pathname === "/_vinext/image") {
      return handleImageOptimization(
        trustedRequest,
        {
          fetchAsset: (path) => {
            const assetUrl = new URL(path, trustedRequest.url);
            if (!env.ASSETS && assetUrl.origin !== url.origin) {
              return Promise.resolve(
                new Response("Origen de imagen no permitido.", { status: 403 }),
              );
            }
            const assetRequest = new Request(assetUrl);
            return env.ASSETS
              ? env.ASSETS.fetch(assetRequest)
              : fetch(assetRequest);
          },
          transformImage: async (body, { width, format, quality }) => {
            const result = await env.IMAGES.input(body)
              .transform(width > 0 ? { width } : {})
              .output({ format, quality });
            return result.response();
          },
        },
        [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES],
      );
    }

    const response = await handler.fetch(trustedRequest, env, ctx);
    return applySecurityHeaders(trustedRequest, response);
  },
};

export default worker;
