export interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string;
  featured?: boolean;
  accent: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  publishedAt: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  intro: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
  relatedCategorySlugs: string[];
  sources: string[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  href: string;
  accent: "sage" | "peach" | "blue";
  productIds: string[];
}

export interface Address {
  id: string;
  label: string;
  street: string;
  postalCode: string;
  city: string;
  province: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  addresses: Address[];
  favoriteProductIds: string[];
}
