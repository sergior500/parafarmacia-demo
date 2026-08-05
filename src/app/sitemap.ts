import type { MetadataRoute } from "next";

import { pharmacyConfig } from "@/lib/config";
import { articles, brands } from "@/mocks/content";
import { categories, products } from "@/mocks/products";

export const dynamic = "force-static";

const routes = [
  "",
  "/parafarmacia",
  "/marcas",
  "/consejos",
  "/como-comprar",
  "/sobre-la-farmacia",
  "/contacto",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/condiciones-de-compra",
  "/envios",
  "/devoluciones",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-08-05");
  return [
    ...routes.map((route) => ({
      url: `${pharmacyConfig.siteUrl}${route}`,
      lastModified: updated,
      changeFrequency:
        route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.6,
    })),
    ...categories.map((category) => ({
      url: `${pharmacyConfig.siteUrl}/categorias/${category.slug}`,
      lastModified: updated,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products
      .filter((product) => product.status === "active")
      .map((product) => ({
        url: `${pharmacyConfig.siteUrl}/productos/${product.slug}`,
        lastModified: updated,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...brands.map((brand) => ({
      url: `${pharmacyConfig.siteUrl}/marcas/${brand.slug}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...articles.map((article) => ({
      url: `${pharmacyConfig.siteUrl}/consejos/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
