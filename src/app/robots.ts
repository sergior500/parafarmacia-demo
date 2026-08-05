import type { MetadataRoute } from "next";

import { pharmacyConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    sitemap: `${pharmacyConfig.siteUrl}/sitemap.xml`,
  };
}
