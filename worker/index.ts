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
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      return handleImageOptimization(
        request,
        {
          fetchAsset: (path) => {
            const assetUrl = new URL(path, request.url);
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

    const response = await handler.fetch(request, env, ctx);
    return applySecurityHeaders(request, response);
  },
};

export default worker;
