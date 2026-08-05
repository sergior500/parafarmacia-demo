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
    brandSlug: "cerave",
    priceInCents: 1695,
    taxRate: 21,
    categoryId: "cat-corporal",
    ean: "DEMO8400000001",
    stock: 21,
    maximumUnitsPerOrder: 4,
    size: "340 g",
    pricePerUnit: "4,99 € / 100 g",
    benefits: ["Hidratación cotidiana", "Textura cremosa", "Rostro y cuerpo"],
    usage:
      "Aplicar sobre la piel limpia siguiendo las indicaciones del envase.",
    ingredients: "Composición definitiva pendiente de la ficha del fabricante.",
    warnings:
      "Uso externo. Consulta el envase original antes de utilizar el producto.",
    skinTypes: ["Normal", "Seca", "Sensible"],
    needs: ["piel-sensible"],
    format: "Tarro",
    fragranceFree: true,
    sensitiveSkin: true,
    badges: ["Más vendido"],
    featured: true,
  }),
  product(2, {
    slug: "isdin-fusion-water-spf50-50-ml",
    name: "ISDIN Fusion Water SPF 50",
    shortDescription: "Fotoprotector facial en formato de muestra de 50 ml.",
    description:
      "Referencia comercial usada únicamente para presentar la experiencia de catálogo. Los datos comerciales son simulados.",
    brandOrLaboratory: "ISDIN",
    brandSlug: "isdin",
    priceInCents: 2495,
    taxRate: 21,
    categoryId: "cat-solar",
    ean: "DEMO8400000002",
    stock: 36,
    size: "50 ml",
    pricePerUnit: "49,90 € / 100 ml",
    benefits: ["Textura ligera", "Uso facial", "Acabado cómodo"],
    usage:
      "Aplicar antes de la exposición y reaplicar según las indicaciones del fabricante.",
    ingredients:
      "Composición definitiva pendiente de la ficha oficial de producto.",
    warnings:
      "Evitar el contacto con los ojos y seguir las indicaciones del envase.",
    skinTypes: ["Todo tipo de piel"],
    needs: ["proteccion-solar"],
    format: "Fluido",
    spf: 50,
    badges: ["Selección solar"],
    featured: true,
  }),
  product(3, {
    slug: "la-roche-posay-cicaplast-baume-b5-40-ml",
    name: "Cicaplast Baume B5+",
    shortDescription: "Bálsamo reparador en formato de muestra de 40 ml.",
    description:
      "Referencia de La Roche-Posay mostrada con información comercial ficticia para fines de demostración.",
    brandOrLaboratory: "La Roche-Posay",
    brandSlug: "la-roche-posay",
    priceInCents: 1295,
    taxRate: 21,
    categoryId: "cat-facial",
    ean: "DEMO8400000003",
    stock: 12,
    size: "40 ml",
    pricePerUnit: "32,38 € / 100 ml",
    benefits: ["Bálsamo multiuso", "Textura confortable", "Formato compacto"],
    usage:
      "Aplicar sobre la zona deseada de acuerdo con la información del envase.",
    ingredients: "Composición pendiente de integrar desde el fabricante.",
    warnings: "Uso externo. Mantener fuera del alcance de los niños.",
    skinTypes: ["Sensible", "Seca"],
    needs: ["piel-sensible"],
    format: "Tubo",
    sensitiveSkin: true,
    featured: true,
  }),
  product(4, {
    slug: "oral-b-pro-expert-cepillo-medio",
    name: "Oral-B Pro-Expert",
    shortDescription: "Cepillo dental manual de dureza media.",
    description:
      "Referencia reconocible para probar filtros, carrito y promociones. Los datos comerciales son simulados.",
    brandOrLaboratory: "Oral-B",
    brandSlug: "oral-b",
    priceInCents: 495,
    taxRate: 21,
    categoryId: "cat-bucal",
    ean: "DEMO8400000004",
    stock: 50,
    size: "1 unidad",
    pricePerUnit: "4,95 € / unidad",
    benefits: ["Uso diario", "Dureza media", "Mango ergonómico"],
    usage:
      "Utilizar en la higiene bucodental diaria y sustituir periódicamente.",
    warnings: "Elegir la dureza adecuada a las necesidades personales.",
    needs: ["cuidado-bucodental"],
    format: "Cepillo manual",
  }),
  product(5, {
    slug: "mustela-hydra-bebe-leche-corporal-500-ml",
    name: "Mustela Hydra Bebé",
    shortDescription: "Leche corporal en formato de muestra de 500 ml.",
    description:
      "Referencia comercial reconocible para la sección infantil. Precio, stock, EAN e imagen son datos de demo.",
    brandOrLaboratory: "Mustela",
    brandSlug: "mustela",
    priceInCents: 1790,
    taxRate: 21,
    categoryId: "cat-infantil",
    ean: "DEMO8400000005",
    stock: 17,
    size: "500 ml",
    pricePerUnit: "3,58 € / 100 ml",
    benefits: ["Uso cotidiano", "Formato familiar", "Textura ligera"],
    usage:
      "Aplicar sobre la piel limpia según las indicaciones del fabricante.",
    ingredients: "Composición definitiva pendiente de la ficha del fabricante.",
    warnings: "Uso externo. Evitar el contacto con los ojos.",
    skinTypes: ["Infantil"],
    needs: ["cuidado-del-bebe"],
    format: "Dosificador",
    featured: true,
  }),
  product(6, {
    slug: "suavinex-esponja-natural",
    name: "Suavinex Esponja Natural",
    shortDescription: "Accesorio infantil temporalmente sin stock.",
    description:
      "Referencia de muestra incluida para demostrar la indisponibilidad de un producto.",
    brandOrLaboratory: "Suavinex",
    brandSlug: "suavinex",
    priceInCents: 695,
    taxRate: 21,
    categoryId: "cat-infantil",
    ean: "DEMO8400000006",
    stock: 0,
    size: "1 unidad",
    pricePerUnit: "6,95 € / unidad",
    benefits: ["Accesorio de baño", "Textura natural", "Formato infantil"],
    needs: ["cuidado-del-bebe"],
    format: "Accesorio",
    status: "temporarily_unavailable",
  }),
  product(7, {
    slug: "bioderma-sensibio-h2o-500-ml",
    name: "Bioderma Sensibio H2O",
    shortDescription: "Agua micelar en formato de muestra de 500 ml.",
    description:
      "Referencia reconocible para la experiencia de compra de parafarmacia. Los datos comerciales son ficticios.",
    brandOrLaboratory: "Bioderma",
    brandSlug: "bioderma",
    priceInCents: 1890,
    taxRate: 21,
    categoryId: "cat-facial",
    ean: "DEMO8400000007",
    stock: 9,
    size: "500 ml",
    pricePerUnit: "3,78 € / 100 ml",
    benefits: ["Limpieza facial", "Sin aclarado", "Formato grande"],
    usage:
      "Aplicar con un disco reutilizable o algodón según las indicaciones del envase.",
    ingredients: "Composición definitiva pendiente de integración.",
    warnings: "Uso externo. Evitar el contacto directo con los ojos.",
    skinTypes: ["Sensible", "Normal"],
    needs: ["piel-sensible"],
    format: "Botella",
    sensitiveSkin: true,
  }),
  product(8, {
    slug: "klorane-champu-avena-400-ml",
    name: "Klorane Champú a la Avena",
    shortDescription:
      "Champú de uso frecuente en formato de muestra de 400 ml.",
    description:
      "Referencia comercial de cuidado capilar con precio, stock y código simulados.",
    brandOrLaboratory: "Klorane",
    brandSlug: "klorane",
    priceInCents: 1490,
    taxRate: 21,
    categoryId: "cat-higiene",
    ean: "DEMO8400000008",
    stock: 25,
    size: "400 ml",
    pricePerUnit: "3,73 € / 100 ml",
    benefits: ["Uso frecuente", "Formato familiar", "Cuidado capilar"],
    usage: "Aplicar sobre el cabello húmedo y aclarar siguiendo el envase.",
    warnings: "Evitar el contacto con los ojos.",
    needs: ["caida-del-cabello"],
    format: "Botella",
  }),
  product(9, {
    slug: "eucerin-aquaphor-pomada-reparadora-45-ml",
    name: "Eucerin Aquaphor",
    shortDescription: "Pomada reparadora en formato de muestra de 45 ml.",
    description:
      "Producto de muestra para ampliar el catálogo corporal de la demostración.",
    brandOrLaboratory: "Eucerin",
    brandSlug: "eucerin",
    priceInCents: 1195,
    taxRate: 21,
    categoryId: "cat-corporal",
    ean: "DEMO8400000009",
    stock: 14,
    size: "45 ml",
    pricePerUnit: "26,56 € / 100 ml",
    benefits: ["Textura protectora", "Formato compacto", "Uso localizado"],
    usage: "Aplicar una capa fina según las indicaciones del fabricante.",
    warnings: "Uso externo.",
    skinTypes: ["Seca", "Muy seca"],
    needs: ["piel-sensible"],
    format: "Tubo",
  }),
  product(10, {
    slug: "vichy-mineral-89-50-ml",
    name: "Vichy Minéral 89",
    shortDescription:
      "Booster hidratante facial en formato de muestra de 50 ml.",
    description:
      "Referencia reconocible incluida para probar catálogo, pedidos y analítica comercial.",
    brandOrLaboratory: "Vichy",
    brandSlug: "vichy",
    priceInCents: 2390,
    taxRate: 21,
    categoryId: "cat-facial",
    ean: "DEMO8400000010",
    stock: 7,
    size: "50 ml",
    pricePerUnit: "47,80 € / 100 ml",
    benefits: ["Textura ligera", "Uso facial", "Rutina de hidratación"],
    usage: "Aplicar sobre rostro limpio antes de la crema habitual.",
    ingredients: "Composición definitiva pendiente de la ficha del fabricante.",
    warnings: "Uso externo.",
    skinTypes: ["Todo tipo de piel"],
    needs: ["piel-sensible"],
    format: "Dosificador",
  }),
  product(11, {
    slug: "lacer-clorhexidina-pasta-dental-75-ml",
    name: "Lacer Clorhexidina",
    shortDescription: "Pasta dentífrica en formato de muestra de 75 ml.",
    description:
      "Referencia de higiene bucal marcada como inactiva para demostrar la gestión de catálogo.",
    brandOrLaboratory: "Lacer",
    brandSlug: "lacer",
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
    brandSlug: "la-roche-posay",
    priceInCents: 2295,
    taxRate: 21,
    categoryId: "cat-solar",
    ean: "DEMO8400000012",
    stock: 0,
    status: "withdrawn",
    availableForOnlineSale: false,
  }),
  product(13, {
    slug: "solgar-vitamina-c-500-mg-100-capsulas",
    name: "Solgar Vitamina C 500 mg",
    shortDescription:
      "Complemento alimenticio en formato de muestra de 100 cápsulas.",
    description:
      "Referencia comercial incluida para demostrar una categoría de nutrición. No sustituye una alimentación variada y equilibrada.",
    brandOrLaboratory: "Solgar",
    brandSlug: "solgar",
    priceInCents: 2195,
    taxRate: 10,
    categoryId: "cat-nutricion",
    ean: "DEMO8400000013",
    stock: 15,
    size: "100 cápsulas",
    pricePerUnit: "0,22 € / cápsula",
    benefits: [
      "Formato de 100 cápsulas",
      "Uso según etiquetado",
      "Complemento alimenticio",
    ],
    usage:
      "Seguir exclusivamente la dosis y advertencias indicadas en el etiquetado original.",
    ingredients:
      "Composición definitiva pendiente de la ficha y etiquetado del fabricante.",
    warnings:
      "Los complementos alimenticios no sustituyen una dieta equilibrada. No superar la dosis indicada.",
    needs: ["nutricion-bienestar"],
    format: "Cápsulas",
  }),
  product(14, {
    slug: "compeed-ampollas-medianas-5-apositos",
    name: "Compeed Ampollas Medianas",
    shortDescription: "Pack de muestra con 5 apósitos para el cuidado del pie.",
    description:
      "Producto sanitario reconocible incluido para presentar navegación y venta online permitida. Datos comerciales simulados.",
    brandOrLaboratory: "Compeed",
    brandSlug: "compeed",
    priceInCents: 895,
    taxRate: 21,
    categoryId: "cat-salud",
    ean: "DEMO8400000014",
    stock: 28,
    size: "5 apósitos",
    pricePerUnit: "1,79 € / unidad",
    benefits: ["Formato compacto", "Uso localizado", "Producto sanitario"],
    usage: "Leer y seguir las instrucciones del envase antes de aplicar.",
    warnings:
      "Consulta las advertencias del fabricante y no utilices el producto si el envase está dañado.",
    needs: ["recuperacion-muscular"],
    format: "Apósitos",
  }),
  product(15, {
    slug: "farmalastic-munequera-elastica-talla-unica",
    name: "Farmalastic Muñequera Elástica",
    shortDescription: "Soporte elástico de muñeca en talla de demostración.",
    description:
      "Referencia de ortopedia ligera para enseñar filtros, talla y productos complementarios. Información comercial ficticia.",
    brandOrLaboratory: "Farmalastic",
    brandSlug: "farmalastic",
    priceInCents: 1495,
    taxRate: 21,
    categoryId: "cat-ortopedia",
    ean: "DEMO8400000015",
    stock: 11,
    size: "Talla única demo",
    pricePerUnit: "14,95 € / unidad",
    benefits: ["Tejido elástico", "Formato reutilizable", "Ortopedia ligera"],
    usage:
      "Ajustar siguiendo las instrucciones del envase sin apretar en exceso.",
    warnings:
      "La talla y el uso deben confirmarse con la información definitiva del fabricante.",
    needs: ["recuperacion-muscular"],
    format: "Soporte elástico",
  }),
];
