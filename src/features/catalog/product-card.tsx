"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProductVisual } from "@/components/shared/product-visual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMaximumCartQuantity } from "@/domain/cart/cart";
import {
  isProductAvailable,
  isProductPricePending,
  type Product,
} from "@/domain/product/product";
import { FavoriteButton } from "@/features/catalog/favorite-button";
import { useStorefront } from "@/features/storefront/storefront-provider";
import { formatMoney } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, cart, hydrated } = useStorefront();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const available = isProductAvailable(product);
  const pricePending = isProductPricePending(product);
  const maximum = getMaximumCartQuantity(product);
  const existingQuantity =
    cart.find((line) => line.product.id === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, maximum - existingQuantity);
  const selectedQuantity =
    available && remaining ? Math.min(quantity, remaining) : 0;
  const canAdd = available && hydrated && remaining > 0;

  function handleAdd() {
    try {
      addToCart(product, selectedQuantity);
      setMessage(
        selectedQuantity === 1
          ? "1 unidad añadida"
          : `${selectedQuantity} unidades añadidas`,
      );
      setQuantity(1);
      window.setTimeout(() => setMessage(""), 1600);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido añadir.",
      );
    }
  }

  return (
    <article className="border-forest/10 group flex h-full flex-col rounded-[1.4rem] border bg-[#fcfaf5] p-3 shadow-[0_14px_45px_-38px_rgba(16,42,33,.75)] transition-[transform,box-shadow,background-color] hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_60px_-36px_rgba(16,42,33,.5)] sm:p-4">
      <div className="relative">
        <Link href={`/productos/${product.slug}`}>
          <ProductVisual
            product={product}
            className="aspect-square overflow-hidden rounded-[1rem]"
          />
        </Link>
        <FavoriteButton
          productId={product.id}
          className="absolute top-3 right-3 size-10"
        />
        {product.badges?.[0] ? (
          <Badge className="text-forest absolute bottom-3 left-3 bg-white shadow-sm">
            {product.badges[0]}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <Link
          className="text-ink-muted hover:text-forest text-[.68rem] font-black tracking-[.11em] uppercase"
          href={product.brandSlug ? `/marcas/${product.brandSlug}` : "/marcas"}
        >
          {product.brandOrLaboratory}
        </Link>
        <Link
          className="text-forest mt-1.5 line-clamp-2 text-[.98rem] leading-snug font-bold tracking-[-.025em] hover:underline"
          href={`/productos/${product.slug}`}
        >
          {product.name}
        </Link>
        <p className="text-ink-muted mt-1.5 line-clamp-2 text-[.76rem] leading-relaxed">
          {product.shortDescription}
        </p>
        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3">
            <span>
              <strong className="text-forest block text-lg font-black tracking-[-.035em]">
                {pricePending
                  ? "Precio pendiente"
                  : formatMoney(product.priceInCents)}
              </strong>
              {product.pricePerUnit ? (
                <span className="text-ink-muted block text-[.62rem]">
                  {product.pricePerUnit}
                </span>
              ) : null}
            </span>
            <span
              className={`text-[.65rem] font-bold ${available ? "text-emerald-700" : "text-stone-500"}`}
            >
              {available
                ? "En stock"
                : pricePending
                  ? "Pendiente de alta"
                  : "No disponible"}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <div
              className={`border-forest/15 min-h-11 shrink-0 items-center rounded-full border bg-white ${available ? "flex" : "hidden"}`}
            >
              <button
                type="button"
                className="text-forest grid size-10 place-items-center disabled:opacity-30"
                aria-label={`Reducir cantidad de ${product.name}`}
                disabled={!canAdd || selectedQuantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus aria-hidden="true" className="size-3.5" />
              </button>
              <input
                aria-label={`Cantidad de ${product.name}`}
                className="w-7 bg-transparent text-center text-sm font-black outline-none"
                disabled={!canAdd}
                min={canAdd ? 1 : 0}
                max={canAdd ? remaining : 0}
                type="number"
                value={selectedQuantity}
                onChange={(event) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(remaining, Number(event.target.value) || 1),
                    ),
                  )
                }
              />
              <button
                type="button"
                className="text-forest grid size-10 place-items-center disabled:opacity-30"
                aria-label={`Aumentar cantidad de ${product.name}`}
                disabled={!canAdd || selectedQuantity >= remaining}
                onClick={() =>
                  setQuantity((value) => Math.min(remaining, value + 1))
                }
              >
                <Plus aria-hidden="true" className="size-3.5" />
              </button>
            </div>
            <Button
              className="min-w-0 flex-1 px-3"
              disabled={!canAdd}
              onClick={handleAdd}
              aria-label={
                !available
                  ? `${product.name} no disponible para venta`
                  : remaining
                    ? `Añadir ${selectedQuantity} ${product.name} al carrito`
                    : `Límite alcanzado para ${product.name}`
              }
            >
              {message.includes("añadida") ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <ShoppingBag aria-hidden="true" className="size-4" />
              )}
              <span className="hidden min-[360px]:inline">
                {!available
                  ? pricePending
                    ? "Próximamente"
                    : "No disponible"
                  : remaining > 0
                    ? message.includes("añadida")
                      ? "Añadido"
                      : "Añadir"
                    : "Límite alcanzado"}
              </span>
            </Button>
          </div>
          <p
            className={`mt-2 text-[.65rem] ${message && !message.includes("añadida") ? "text-red-700" : "text-ink-muted"}`}
            role={message ? "status" : undefined}
          >
            {message ||
              (!available
                ? pricePending
                  ? "Precio y stock pendientes de validación"
                  : "Temporalmente no disponible"
                : existingQuantity
                  ? `${existingQuantity} en cesta · máximo ${maximum}`
                  : `Máximo ${maximum} unidades por pedido`)}
          </p>
        </div>
      </div>
    </article>
  );
}
