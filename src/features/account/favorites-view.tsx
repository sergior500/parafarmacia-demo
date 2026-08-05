"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/catalog/product-card";
import { products } from "@/mocks/products";

const KEY = "parafarmacia-demo-favorites-v1";

export function FavoritesView() {
  const [ids, setIds] = useState<string[] | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setIds(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
      } catch {
        setIds([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  if (ids === null)
    return (
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="bg-cream-dark aspect-[3/4] animate-pulse rounded-[1.7rem]"
            key={index}
          />
        ))}
      </div>
    );
  const favorites = products.filter((product) => ids.includes(product.id));
  if (!favorites.length)
    return (
      <div className="border-forest/20 rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center">
        <Heart aria-hidden="true" className="text-coral mx-auto size-8" />
        <h2 className="font-display text-forest mt-5 text-4xl">
          Todavía no has guardado nada
        </h2>
        <p className="text-ink-muted mx-auto mt-3 max-w-md text-sm">
          Pulsa el corazón de cualquier producto para crear una lista que puedas
          recuperar en este navegador.
        </p>
        <Button asChild className="mt-7">
          <Link href="/parafarmacia">Explorar productos</Link>
        </Button>
      </div>
    );
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {favorites.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  );
}
