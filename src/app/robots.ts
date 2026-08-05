import type { MetadataRoute } from "next";

import { pharmacyConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: pharmacyConfig.allowIndexing
      ? {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/admin/",
            "/carrito",
            "/solicitud-pedido",
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
