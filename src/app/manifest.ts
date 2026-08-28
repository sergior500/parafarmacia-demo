import type { MetadataRoute } from "next";

import { pharmacyConfig } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${pharmacyConfig.name} · Parafarmacia online`,
    short_name: pharmacyConfig.name,
    description:
      "Dermocosmética, protección solar, higiene y bienestar de Farmacia Picual.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f5ed",
    theme_color: "#173e35",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
