"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getMaximumCartQuantity } from "@/domain/cart/cart";
import { isProductAvailable, type Product } from "@/domain/product/product";
import { useStorefront } from "@/features/storefront/storefront-provider";

export function AddToCartPanel({ product }: { product: Product }) {
  const { addToCart, cart, hydrated } = useStorefront();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const available = isProductAvailable(product);
  const maximum = getMaximumCartQuantity(product);
  const existingQuantity =
    cart.find((line) => line.product.id === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, maximum - existingQuantity);
  const selectedQuantity =
    available && remaining ? Math.min(quantity, remaining) : 0;

  function add() {
    try {
      addToCart(product, selectedQuantity);
      setMessage("Producto añadido al carrito.");
      setQuantity(1);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido añadir.",
      );
    }
  }

  function buyNow() {
    try {
      addToCart(product, selectedQuantity);
      router.push("/carrito");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido añadir.",
      );
    }
  }

  return (
    <div className="border-forest/10 md:bg-cream-dark/70 fixed inset-x-2 bottom-2 z-30 rounded-[1.25rem] border bg-white p-2 shadow-2xl md:static md:rounded-2xl md:p-5 md:shadow-none">
      <label
        className="text-forest mb-1.5 hidden text-[.84rem] font-bold md:block"
        htmlFor="quantity"
      >
        Cantidad
      </label>
      <div className="flex gap-2 md:gap-3">
        <div className="border-forest/20 flex min-h-10 items-center rounded-full border bg-white md:min-h-12">
          <button
            type="button"
            className="text-forest grid size-10 place-items-center disabled:opacity-30 md:size-12"
            aria-label="Reducir cantidad"
            disabled={!available || !remaining || selectedQuantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <input
            id="quantity"
            aria-label="Cantidad"
            className="w-10 border-0 bg-transparent text-center font-bold outline-none"
            disabled={!available || !remaining}
            min={available && remaining ? 1 : 0}
            max={available ? remaining : 0}
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
            className="text-forest grid size-10 place-items-center disabled:opacity-30 md:size-12"
            aria-label="Aumentar cantidad"
            disabled={!available || !remaining || selectedQuantity >= remaining}
            onClick={() =>
              setQuantity((value) => Math.min(remaining, value + 1))
            }
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
        <Button
          className="flex-1 px-3"
          disabled={!available || !hydrated || !remaining}
          onClick={add}
        >
          <ShoppingBag aria-hidden="true" className="size-4" />
          <span className="hidden min-[390px]:inline">
            {remaining
              ? available
                ? "Añadir a la cesta"
                : "No disponible"
              : "Límite alcanzado"}
          </span>
          <span className="min-[390px]:hidden">
            {remaining ? (available ? "Añadir" : "Agotado") : "Máximo"}
          </span>
        </Button>
        <Button
          className="hidden md:inline-flex"
          disabled={!available || !hydrated || !remaining}
          variant="outline"
          onClick={buyNow}
        >
          Comprar ahora
        </Button>
      </div>
      {available ? (
        <p className="text-ink-muted mt-3 hidden text-xs md:block">
          {existingQuantity
            ? `${existingQuantity} en la cesta · puedes añadir ${remaining} más · máximo ${maximum}.`
            : `Máximo ${maximum} unidades por pedido.`}
        </p>
      ) : null}
      {message ? (
        <p
          className="text-forest border-forest/10 absolute right-0 bottom-[calc(100%+.5rem)] rounded-full border bg-white px-4 py-2 text-xs font-semibold shadow-lg md:static md:mt-3 md:border-0 md:bg-transparent md:p-0 md:text-sm md:shadow-none"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
