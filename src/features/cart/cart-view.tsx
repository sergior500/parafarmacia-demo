"use client";

import { Minus, PackageCheck, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProductVisual } from "@/components/shared/product-visual";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateCartTotals } from "@/domain/cart/cart";
import { useDemo } from "@/features/demo/demo-provider";
import { formatMoney } from "@/lib/format";

export function CartView() {
  const { cart, removeFromCart, updateCartQuantity } = useDemo();
  const [error, setError] = useState("");
  const totals = calculateCartTotals(cart);

  function update(productId: string, quantity: number) {
    try {
      setError("");
      updateCartQuantity(productId, quantity);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se ha podido actualizar la cantidad.",
      );
    }
  }

  if (cart.length === 0) {
    return (
      <div className="border-forest/25 rounded-3xl border border-dashed bg-white px-6 py-16 text-center">
        <p className="font-display text-forest text-4xl">
          Tu carrito está vacío
        </p>
        <p className="text-ink-muted mt-3">
          Explora la tienda de demostración y añade algún producto para
          continuar.
        </p>
        <Button asChild className="mt-7">
          <Link href="/buscar">Explorar catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-8">
        <section>
          <h2 className="font-display text-forest text-3xl">Tus productos</h2>
          <div className="mt-4 grid gap-3">
            {cart.map((line) => (
              <Card
                className="grid grid-cols-[6rem_1fr] gap-4 p-3 sm:grid-cols-[7rem_1fr_auto] sm:items-center"
                key={line.product.id}
              >
                <ProductVisual product={line.product} />
                <div>
                  <Link
                    className="font-display text-forest hover:text-coral text-xl"
                    href={`/productos/${line.product.slug}`}
                  >
                    {line.product.name}
                  </Link>
                  <p className="text-ink-muted text-sm">
                    {line.product.brandOrLaboratory}
                  </p>
                  <p className="text-forest mt-2 font-bold">
                    {formatMoney(line.product.priceInCents * line.quantity)}
                  </p>
                </div>
                <div className="border-forest/10 col-span-2 flex items-center justify-between border-t pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
                  <div className="border-forest/20 flex items-center rounded-full border">
                    <button
                      type="button"
                      className="text-forest grid size-10 place-items-center disabled:opacity-30"
                      aria-label={`Reducir ${line.product.name}`}
                      disabled={line.quantity <= 1}
                      onClick={() => update(line.product.id, line.quantity - 1)}
                    >
                      <Minus aria-hidden="true" className="size-4" />
                    </button>
                    <span
                      className="w-7 text-center font-bold"
                      aria-label={`${line.quantity} unidades`}
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="text-forest grid size-10 place-items-center disabled:opacity-30"
                      aria-label={`Aumentar ${line.product.name}`}
                      disabled={
                        line.quantity >=
                        Math.min(
                          line.product.stock,
                          line.product.maximumUnitsPerOrder ??
                            line.product.stock,
                        )
                      }
                      onClick={() => update(line.product.id, line.quantity + 1)}
                    >
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Eliminar ${line.product.name}`}
                    onClick={() => removeFromCart(line.product.id)}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
        {error ? (
          <p
            className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <aside>
        <Card className="sticky top-28 p-6">
          <h2 className="font-display text-forest text-3xl">Resumen</h2>
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Base imponible</dt>
              <dd>{formatMoney(totals.subtotalInCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Impuestos incluidos</dt>
              <dd>{formatMoney(totals.taxInCents)}</dd>
            </div>
            <div className="border-forest/10 text-forest mt-2 flex justify-between gap-4 border-t pt-4 text-lg font-black">
              <dt>Total</dt>
              <dd>{formatMoney(totals.totalInCents)}</dd>
            </div>
          </dl>
          <div className="bg-sage text-forest mt-6 rounded-2xl p-4 text-sm">
            <PackageCheck aria-hidden="true" className="mb-2 size-5" />
            Compra de demostración: no se realizará ningún pago ni reserva de
            stock real.
          </div>
          <Button asChild className="mt-5 w-full">
            <Link href="/solicitud-pedido">Finalizar compra demo</Link>
          </Button>
        </Card>
      </aside>
    </div>
  );
}
