import type { MetadataRoute } from "next";

import { pharmacyConfig } from "@/lib/config";
import { categories, products } from "@/mocks/products";

const routes = [
  "",
  "/parafarmacia",
  "/buscar",
  "/carrito",
  "/solicitud-pedido",
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
  const staticEntries = routes.map((route) => ({
    url: `${pharmacyConfig.siteUrl}${route}`,
    lastModified: new Date("2026-07-25"),
  }));
  const categoryEntries = categories.map((category) => ({
    url: `${pharmacyConfig.siteUrl}/categorias/${category.slug}`,
    lastModified: new Date("2026-07-25"),
  }));
  const productEntries = products
    .filter((product) => product.status === "active")
    .map((product) => ({
      url: `${pharmacyConfig.siteUrl}/productos/${product.slug}`,
      lastModified: new Date("2026-07-25"),
    }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
