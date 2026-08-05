"use client";

import { Check, Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProductVisual } from "@/components/shared/product-visual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isProductAvailable, type Product } from "@/domain/product/product";
import { useDemo } from "@/features/demo/demo-provider";
import { formatMoney } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, hydrated } = useDemo();
  const [message, setMessage] = useState("");
  const available = isProductAvailable(product);

  function handleAdd() {
    try {
      addToCart(product);
      setMessage("Añadido");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido añadir.",
      );
    }
  }

  return (
    <Card className="group hover:border-forest/15 flex h-full flex-col overflow-hidden p-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_75px_-40px_rgba(18,63,56,.55)]">
      <Link href={`/productos/${product.slug}`}>
        <ProductVisual
          product={product}
          className="transition-transform duration-300"
        />
      </Link>
      <div className="flex flex-1 flex-col px-2.5 pt-4 pb-2.5">
        <div className="mb-2.5 flex flex-wrap gap-2">
          <Badge>Parafarmacia</Badge>
          {!available ? (
            <Badge className="bg-stone-200 text-stone-700">No disponible</Badge>
          ) : null}
        </div>
        <Link
          className="font-display text-forest hover:text-coral text-[1.15rem] leading-[1.15] font-bold tracking-[-0.035em] transition-colors"
          href={`/productos/${product.slug}`}
        >
          {product.name}
        </Link>
        <p className="text-ink-muted mt-2 line-clamp-2 text-[0.8rem] leading-relaxed">
          {product.shortDescription}
        </p>
        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-end justify-between gap-3">
            <span className="text-forest text-[1.15rem] font-black tracking-[-0.03em]">
              {formatMoney(product.priceInCents)}
            </span>
            <span className="text-ink-muted text-[0.62rem] font-semibold">
              IVA incluido
            </span>
          </div>
          <Button
            className="min-h-10 w-full text-xs"
            disabled={!available || !hydrated}
            onClick={handleAdd}
            aria-label={`Añadir ${product.name} al carrito`}
          >
            {message === "Añadido" ? (
              <Check aria-hidden="true" className="size-4" />
            ) : available ? (
              <Plus aria-hidden="true" className="size-4" />
            ) : (
              <ShieldAlert aria-hidden="true" className="size-4" />
            )}
            {message === "Añadido"
              ? "Añadido"
              : available
                ? "Añadir"
                : "No disponible"}
          </Button>
          {message && message !== "Añadido" ? (
            <p className="mt-2 text-xs text-red-700" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
