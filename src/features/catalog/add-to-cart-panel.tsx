"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { isProductAvailable, type Product } from "@/domain/product/product";
import { useDemo } from "@/features/demo/demo-provider";

export function AddToCartPanel({ product }: { product: Product }) {
  const { addToCart, hydrated } = useDemo();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const available = isProductAvailable(product);
  const maximum = Math.min(
    product.stock,
    product.maximumUnitsPerOrder ?? product.stock,
  );

  function add() {
    try {
      addToCart(product, quantity);
      setMessage("Producto añadido al carrito.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido añadir.",
      );
    }
  }

  return (
    <div className="bg-cream-dark/70 rounded-2xl p-5">
      <label className="field-label" htmlFor="quantity">
        Cantidad
      </label>
      <div className="flex gap-3">
        <div className="border-forest/20 flex min-h-12 items-center rounded-full border bg-white">
          <button
            type="button"
            className="text-forest grid size-12 place-items-center disabled:opacity-30"
            aria-label="Reducir cantidad"
            disabled={quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <input
            id="quantity"
            aria-label="Cantidad"
            className="w-10 border-0 bg-transparent text-center font-bold outline-none"
            min="1"
            max={maximum}
            type="number"
            value={quantity}
            onChange={(event) =>
              setQuantity(
                Math.max(1, Math.min(maximum, Number(event.target.value))),
              )
            }
          />
          <button
            type="button"
            className="text-forest grid size-12 place-items-center disabled:opacity-30"
            aria-label="Aumentar cantidad"
            disabled={quantity >= maximum}
            onClick={() => setQuantity((value) => Math.min(maximum, value + 1))}
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
        <Button
          className="flex-1"
          disabled={!available || !hydrated}
          onClick={add}
        >
          <ShoppingBag aria-hidden="true" className="size-4" />
          {available ? "Añadir al carrito" : "No disponible"}
        </Button>
      </div>
      {product.maximumUnitsPerOrder ? (
        <p className="text-ink-muted mt-3 text-xs">
          Máximo {product.maximumUnitsPerOrder} unidades por solicitud.
        </p>
      ) : null}
      {message ? (
        <p className="text-forest mt-3 text-sm font-semibold" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
