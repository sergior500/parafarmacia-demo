import type { MetadataRoute } from "next";

import { pharmacyConfig } from "@/lib/config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: pharmacyConfig.allowIndexing
      ? {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/admin/",
            "/carrito",
            "/cuenta",
            "/favoritos",
            "/buscar",
            "/*?*",
          ],
        }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${pharmacyConfig.siteUrl}/sitemap.xml`,
  };
}
