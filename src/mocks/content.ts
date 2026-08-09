import type { Article, Brand, FAQ, Promotion } from "@/domain/content/content";

export const needs = [
  {
    slug: "piel-sensible",
    name: "Piel sensible",
    description: "Rutinas suaves y respetuosas",
    categorySlug: "cuidado-facial",
  },
  {
    slug: "proteccion-solar",
    name: "Protección solar",
    description: "Protección facial y corporal",
    categorySlug: "proteccion-solar",
  },
  {
    slug: "caida-del-cabello",
    name: "Caída del cabello",
    description: "Cuidado del cuero cabelludo",
    categorySlug: "higiene-diaria",
  },
  {
    slug: "cuidado-del-bebe",
    name: "Cuidado del bebé",
    description: "Higiene para los más pequeños",
    categorySlug: "cuidado-infantil",
  },
  {
    slug: "higiene-intima",
    name: "Higiene íntima",
    description: "Cuidado cotidiano y delicado",
    categorySlug: "higiene-diaria",
  },
  {
    slug: "recuperacion-muscular",
    name: "Recuperación muscular",
    description: "Confort después del movimiento",
    categorySlug: "ortopedia-y-recuperacion",
  },
  {
    slug: "nutricion-bienestar",
    name: "Nutrición y bienestar",
    description: "Hábitos para sentirte bien",
    categorySlug: "nutricion",
  },
  {
    slug: "cuidado-bucodental",
    name: "Cuidado bucodental",
    description: "Higiene diaria de boca y encías",
    categorySlug: "higiene-bucal",
  },
] as const;

export const brands: Brand[] = [
  {
    id: "brand-cerave",
    slug: "cerave",
    name: "CeraVe",
    description: "Cuidado diario para reforzar la hidratación de la piel.",
    featured: true,
    accent: "#dcefea",
  },
  {
    id: "brand-isdin",
    slug: "isdin",
    name: "ISDIN",
    description: "Fotoprotección y cuidado de la piel para el día a día.",
    featured: true,
    accent: "#fff0d7",
  },
  {
    id: "brand-lrp",
    slug: "la-roche-posay",
    name: "La Roche-Posay",
    description:
      "Dermocosmética pensada para distintas necesidades de la piel.",
    featured: true,
    accent: "#e6eff7",
  },
  {
    id: "brand-mustela",
    slug: "mustela",
    name: "Mustela",
    description: "Higiene y cuidado cotidiano de bebés y familias.",
    featured: true,
    accent: "#fff0e4",
  },
  {
    id: "brand-bioderma",
    slug: "bioderma",
    name: "Bioderma",
    description: "Limpieza y cuidado dermocosmético de uso cotidiano.",
    featured: true,
    accent: "#f1e9f7",
  },
  {
    id: "brand-eucerin",
    slug: "eucerin",
    name: "Eucerin",
    description: "Cuidado corporal y facial con texturas funcionales.",
    accent: "#f8e5e5",
  },
  {
    id: "brand-vichy",
    slug: "vichy",
    name: "Vichy",
    description: "Rutinas faciales para hidratar y cuidar la piel.",
    accent: "#e5f0ee",
  },
  {
    id: "brand-klorane",
    slug: "klorane",
    name: "Klorane",
    description: "Cuidado capilar inspirado en ingredientes botánicos.",
    accent: "#e8f0df",
  },
  {
    id: "brand-oral-b",
    slug: "oral-b",
    name: "Oral-B",
    description: "Productos para completar la higiene bucodental diaria.",
    accent: "#e4ecf8",
  },
  {
    id: "brand-suavinex",
    slug: "suavinex",
    name: "Suavinex",
    description: "Accesorios y cuidado cotidiano para bebés.",
    accent: "#fae8ec",
  },
  {
    id: "brand-solgar",
    slug: "solgar",
    name: "Solgar",
    description: "Complementos alimenticios en distintos formatos.",
    accent: "#f1ead7",
  },
  {
    id: "brand-compeed",
    slug: "compeed",
    name: "Compeed",
    description: "Productos sanitarios para el cuidado cotidiano del pie.",
    accent: "#e8e2f3",
  },
  {
    id: "brand-farmalastic",
    slug: "farmalastic",
    name: "Farmalastic",
    description: "Soportes y soluciones de ortopedia ligera.",
    accent: "#e0ecea",
  },
];

export const commonFaqs: FAQ[] = [
  {
    question: "¿Los productos y precios son reales?",
    answer:
      "Las marcas y formatos sirven como referencias reconocibles, pero precios, stock, códigos e imágenes son datos de demostración.",
  },
  {
    question: "¿Se realiza algún cobro?",
    answer:
      "No. La demo permite elegir tarjeta o Bizum, pero no conecta con una pasarela de pago, no solicita datos bancarios ni reserva stock.",
  },
  {
    question: "¿Cuándo recibiría mi pedido en una tienda real?",
    answer:
      "El plazo dependerá del transportista, la zona y el horario de preparación que se acuerden antes del lanzamiento.",
  },
];

export const articles: Article[] = [
  {
    id: "article-1",
    slug: "como-elegir-protector-solar-tipo-piel",
    title: "Cómo elegir un protector solar según tu tipo de piel",
    excerpt:
      "Textura, nivel de protección y rutina: una guía sencilla para comparar opciones.",
    category: "Protección solar",
    author: "Equipo editorial de demostración",
    publishedAt: "2026-06-12",
    updatedAt: "2026-07-28",
    readTime: "6 min",
    intro:
      "Elegir un protector solar resulta más fácil cuando se tienen claras la textura preferida, la exposición prevista y las necesidades cotidianas de la piel.",
    sections: [
      {
        title: "Empieza por el nivel de protección",
        paragraphs: [
          "Para el uso diario conviene comparar productos de amplio espectro y seguir siempre las indicaciones de aplicación del fabricante.",
          "La cantidad y la reaplicación son tan importantes como el formato elegido.",
        ],
      },
      {
        title: "Elige una textura cómoda",
        paragraphs: [
          "Los fluidos ligeros suelen encajar bien en rutinas faciales; las cremas y lociones facilitan cubrir zonas amplias del cuerpo.",
        ],
      },
      {
        title: "Haz que forme parte de tu rutina",
        paragraphs: [
          "Coloca el producto junto a los básicos de la mañana y comprueba que su textura funciona bien con el resto de tu rutina.",
        ],
      },
    ],
    relatedCategorySlugs: ["proteccion-solar", "cuidado-facial"],
    sources: [
      "Información general de fotoprotección de organismos sanitarios; ficha definitiva pendiente de validación.",
    ],
  },
  {
    id: "article-2",
    slug: "rutina-facial-piel-sensible",
    title: "Una rutina facial sencilla para piel sensible",
    excerpt:
      "Cómo reducir pasos y priorizar texturas suaves en la limpieza e hidratación diaria.",
    category: "Dermocosmética",
    author: "Equipo editorial de demostración",
    publishedAt: "2026-05-18",
    updatedAt: "2026-07-20",
    readTime: "5 min",
    intro:
      "Una rutina corta y constante ayuda a identificar qué productos resultan cómodos para la piel y evita introducir demasiados cambios a la vez.",
    sections: [
      {
        title: "Limpieza sin complicaciones",
        paragraphs: [
          "Elige un limpiador adecuado al uso diario y evita añadir pasos que no aporten valor a tu rutina.",
        ],
      },
      {
        title: "Hidratación y protección",
        paragraphs: [
          "Una crema de textura agradable y la protección solar completan una base fácil de mantener.",
        ],
      },
    ],
    relatedCategorySlugs: ["cuidado-facial"],
    sources: [
      "Contenido editorial de demostración; las fichas de fabricantes deberán ser la fuente de cada producto.",
    ],
  },
  {
    id: "article-3",
    slug: "basicos-cuidado-recien-nacido",
    title: "Qué básicos de cuidado necesita un recién nacido",
    excerpt:
      "Una lista contenida para preparar higiene, baño y cambio sin acumular productos innecesarios.",
    category: "Bebé y maternidad",
    author: "Equipo editorial de demostración",
    publishedAt: "2026-04-08",
    updatedAt: "2026-07-10",
    readTime: "7 min",
    intro:
      "Para empezar suele ser suficiente una selección breve de productos de higiene y accesorios fáciles de utilizar.",
    sections: [
      {
        title: "Menos productos, mejor elegidos",
        paragraphs: [
          "Prioriza formatos sencillos, revisa la edad indicada y consulta siempre las instrucciones del fabricante.",
        ],
      },
      {
        title: "Organiza el momento del baño",
        paragraphs: [
          "Deja a mano únicamente lo necesario y comprueba la temperatura antes de empezar.",
        ],
      },
    ],
    relatedCategorySlugs: ["cuidado-infantil"],
    sources: [
      "Contenido de demostración pendiente de revisión editorial profesional.",
    ],
  },
];

export const promotions: Promotion[] = [
  {
    id: "promo-routine",
    title: "Rutina esencial de hidratación",
    description:
      "Tres pasos visuales para enseñar cómo funcionan los packs y productos complementarios.",
    href: "/categorias/cuidado-facial",
    accent: "sage",
    productIds: ["para-3", "para-7", "para-10"],
  },
  {
    id: "promo-sun",
    title: "Especial protección diaria",
    description: "Selección editorial de fotoprotección facial para la demo.",
    href: "/categorias/proteccion-solar",
    accent: "peach",
    productIds: ["para-2"],
  },
];
