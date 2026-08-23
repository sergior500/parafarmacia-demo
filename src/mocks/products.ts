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

const featuredProductIds = new Set([
  "pdf-dermocosmetica-006",
  "pdf-dermocosmetica-007",
  "pdf-dermocosmetica-008",
  "pdf-dermocosmetica-009",
]);

/** Catálogo trazable a los PDF facilitados, sin precios ni stock inventados. */
export const products: Product[] = productsFromPdf.map((product) => ({
  ...product,
  featured: featuredProductIds.has(product.id),
}));
