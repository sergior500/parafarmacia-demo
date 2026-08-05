import type { Category, Product } from "@/domain/product/product";

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
];

const common = {
  currency: "EUR" as const,
  requiresSpecialTransport: false,
  availableForOnlineSale: true,
  status: "active" as const,
};

function product(
  id: number,
  values: Omit<
    Product,
    | "id"
    | "currency"
    | "imageUrl"
    | "requiresSpecialTransport"
    | "availableForOnlineSale"
    | "status"
  > &
    Partial<
      Pick<
        Product,
        | "status"
        | "requiresSpecialTransport"
        | "availableForOnlineSale"
        | "featured"
      >
    >,
): Product {
  return {
    ...common,
    id: `para-${id}`,
    imageUrl: `/productos/para-${id}.webp`,
    ...values,
  };
}

export const products: Product[] = [
  product(1, {
    slug: "cerave-crema-hidratante-340-g",
    name: "CeraVe Crema Hidratante",
    shortDescription: "Crema hidratante para rostro y cuerpo, formato 340 g.",
    description:
      "Referencia comercial reconocible incluida para mostrar el catálogo de parafarmacia. Precio, stock, EAN e imagen son datos simulados.",
    brandOrLaboratory: "CeraVe",
    priceInCents: 1695,
    taxRate: 21,
    categoryId: "cat-corporal",
    ean: "DEMO8400000001",
    stock: 21,
    maximumUnitsPerOrder: 4,
    featured: true,
  }),
  product(2, {
    slug: "isdin-fusion-water-spf50-50-ml",
    name: "ISDIN Fusion Water SPF 50",
    shortDescription: "Fotoprotector facial en formato de muestra de 50 ml.",
    description:
      "Referencia comercial usada únicamente para presentar la experiencia de catálogo. Los datos comerciales son simulados.",
    brandOrLaboratory: "ISDIN",
    priceInCents: 2495,
    taxRate: 21,
    categoryId: "cat-solar",
    ean: "DEMO8400000002",
    stock: 36,
    featured: true,
  }),
  product(3, {
    slug: "la-roche-posay-cicaplast-baume-b5-40-ml",
    name: "Cicaplast Baume B5+",
    shortDescription: "Bálsamo reparador en formato de muestra de 40 ml.",
    description:
      "Referencia de La Roche-Posay mostrada con información comercial ficticia para fines de demostración.",
    brandOrLaboratory: "La Roche-Posay",
    priceInCents: 1295,
    taxRate: 21,
    categoryId: "cat-facial",
    ean: "DEMO8400000003",
    stock: 12,
    featured: true,
  }),
  product(4, {
    slug: "oral-b-pro-expert-cepillo-medio",
    name: "Oral-B Pro-Expert",
    shortDescription: "Cepillo dental manual de dureza media.",
    description:
      "Referencia reconocible para probar filtros, carrito y promociones. Los datos comerciales son simulados.",
    brandOrLaboratory: "Oral-B",
    priceInCents: 495,
    taxRate: 21,
    categoryId: "cat-bucal",
    ean: "DEMO8400000004",
    stock: 50,
  }),
  product(5, {
    slug: "mustela-hydra-bebe-leche-corporal-500-ml",
    name: "Mustela Hydra Bebé",
    shortDescription: "Leche corporal en formato de muestra de 500 ml.",
    description:
      "Referencia comercial reconocible para la sección infantil. Precio, stock, EAN e imagen son datos de demo.",
    brandOrLaboratory: "Mustela",
    priceInCents: 1790,
    taxRate: 21,
    categoryId: "cat-infantil",
    ean: "DEMO8400000005",
    stock: 17,
    featured: true,
  }),
  product(6, {
    slug: "suavinex-esponja-natural",
    name: "Suavinex Esponja Natural",
    shortDescription: "Accesorio infantil temporalmente sin stock.",
    description:
      "Referencia de muestra incluida para demostrar la indisponibilidad de un producto.",
    brandOrLaboratory: "Suavinex",
    priceInCents: 695,
    taxRate: 21,
    categoryId: "cat-infantil",
    ean: "DEMO8400000006",
    stock: 0,
    status: "temporarily_unavailable",
  }),
  product(7, {
    slug: "bioderma-sensibio-h2o-500-ml",
    name: "Bioderma Sensibio H2O",
    shortDescription: "Agua micelar en formato de muestra de 500 ml.",
    description:
      "Referencia reconocible para la experiencia de compra de parafarmacia. Los datos comerciales son ficticios.",
    brandOrLaboratory: "Bioderma",
    priceInCents: 1890,
    taxRate: 21,
    categoryId: "cat-facial",
    ean: "DEMO8400000007",
    stock: 9,
  }),
  product(8, {
    slug: "klorane-champu-avena-400-ml",
    name: "Klorane Champú a la Avena",
    shortDescription:
      "Champú de uso frecuente en formato de muestra de 400 ml.",
    description:
      "Referencia comercial de cuidado capilar con precio, stock y código simulados.",
    brandOrLaboratory: "Klorane",
    priceInCents: 1490,
    taxRate: 21,
    categoryId: "cat-higiene",
    ean: "DEMO8400000008",
    stock: 25,
  }),
  product(9, {
    slug: "eucerin-aquaphor-pomada-reparadora-45-ml",
    name: "Eucerin Aquaphor",
    shortDescription: "Pomada reparadora en formato de muestra de 45 ml.",
    description:
      "Producto de muestra para ampliar el catálogo corporal de la demostración.",
    brandOrLaboratory: "Eucerin",
    priceInCents: 1195,
    taxRate: 21,
    categoryId: "cat-corporal",
    ean: "DEMO8400000009",
    stock: 14,
  }),
  product(10, {
    slug: "vichy-mineral-89-50-ml",
    name: "Vichy Minéral 89",
    shortDescription:
      "Booster hidratante facial en formato de muestra de 50 ml.",
    description:
      "Referencia reconocible incluida para probar catálogo, pedidos y analítica comercial.",
    brandOrLaboratory: "Vichy",
    priceInCents: 2390,
    taxRate: 21,
    categoryId: "cat-facial",
    ean: "DEMO8400000010",
    stock: 7,
  }),
  product(11, {
    slug: "lacer-clorhexidina-pasta-dental-75-ml",
    name: "Lacer Clorhexidina",
    shortDescription: "Pasta dentífrica en formato de muestra de 75 ml.",
    description:
      "Referencia de higiene bucal marcada como inactiva para demostrar la gestión de catálogo.",
    brandOrLaboratory: "Lacer",
    priceInCents: 825,
    taxRate: 21,
    categoryId: "cat-bucal",
    ean: "DEMO8400000011",
    stock: 18,
    status: "inactive",
    availableForOnlineSale: false,
  }),
  product(12, {
    slug: "anthelios-uvmune-400-fluido-spf50-50-ml",
    name: "Anthelios UVMune 400 SPF 50+",
    shortDescription: "Fluido facial en formato de muestra de 50 ml.",
    description:
      "Referencia retirada utilizada únicamente para demostrar reglas internas de catálogo.",
    brandOrLaboratory: "La Roche-Posay",
    priceInCents: 2295,
    taxRate: 21,
    categoryId: "cat-solar",
    ean: "DEMO8400000012",
    stock: 0,
    status: "withdrawn",
    availableForOnlineSale: false,
  }),
];
