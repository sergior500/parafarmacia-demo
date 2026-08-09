import type { Category, Product } from "@/domain/product/product";
import { productsFromPdf } from "@/mocks/products-from-pdf";

export const categories: Category[] = [
  {
    id: "cat-facial",
    slug: "cuidado-facial",
    name: "Cuidado facial",
    description: "Limpieza, hidratación y rutinas para el cuidado diario.",
  },
  {
    id: "cat-corporal",
    slug: "cuidado-corporal",
    name: "Cuidado corporal",
    description: "Hidratación y cuidado para todo tipo de pieles.",
  },
  {
    id: "cat-solar",
    slug: "proteccion-solar",
    name: "Protección solar",
    description: "Fotoprotección facial y corporal para el día a día.",
  },
  {
    id: "cat-higiene",
    slug: "higiene-diaria",
    name: "Higiene diaria",
    description: "Cuidado capilar, corporal y productos de uso cotidiano.",
  },
  {
    id: "cat-bucal",
    slug: "higiene-bucal",
    name: "Higiene bucal",
    description: "Cepillos, dentífricos y cuidado especializado de la boca.",
  },
  {
    id: "cat-infantil",
    slug: "cuidado-infantil",
    name: "Cuidado infantil",
    description: "Higiene y cuidado diario para bebés y niños.",
  },
  {
    id: "cat-salud",
    slug: "salud-y-bienestar",
    name: "Salud y bienestar",
    description:
      "Productos sanitarios y autocuidado cotidiano permitido online.",
  },
  {
    id: "cat-nutricion",
    slug: "nutricion",
    name: "Nutrición",
    description: "Complementos y formatos para acompañar hábitos equilibrados.",
  },
  {
    id: "cat-ortopedia",
    slug: "ortopedia-y-recuperacion",
    name: "Ortopedia ligera",
    description: "Soportes y accesorios para el movimiento y la recuperación.",
  },
];

/**
 * Catálogo visible de la demo. Solo contiene fichas trazables a los PDF
 * facilitados; no se mezclan referencias comerciales creadas para el prototipo.
 */
const demoCommerce: Record<
  string,
  { priceInCents: number; stock: number; featured?: boolean }
> = {
  "pdf-dermocosmetica-006": { priceInCents: 1490, stock: 12, featured: true },
  "pdf-dermocosmetica-007": { priceInCents: 1590, stock: 8, featured: true },
  "pdf-dermocosmetica-008": { priceInCents: 1390, stock: 15, featured: true },
  "pdf-dermocosmetica-009": { priceInCents: 1190, stock: 18, featured: true },
  "pdf-dermocosmetica-010": { priceInCents: 1690, stock: 7 },
  "pdf-dermocosmetica-012": { priceInCents: 1490, stock: 10 },
  "pdf-dermocosmetica-014": { priceInCents: 1390, stock: 11 },
  "pdf-dermocosmetica-016": { priceInCents: 1990, stock: 6 },
  "pdf-dermocosmetica-017": { priceInCents: 1890, stock: 9 },
  "pdf-dermocosmetica-019": { priceInCents: 1790, stock: 5 },
};

export const products: Product[] = productsFromPdf.map((product) => {
  const commercialData = demoCommerce[product.id];
  if (!commercialData) return product;

  return {
    ...product,
    ...commercialData,
    availableForOnlineSale: true,
    badges: ["Datos comerciales demo", ...(product.badges ?? [])],
  };
});
