"use client";

import {
  Bookmark,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FreeShippingProgress } from "@/components/commerce/free-shipping-progress";
import { ProductVisual } from "@/components/shared/product-visual";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateCartTotals } from "@/domain/cart/cart";
import { ProductCard } from "@/features/catalog/product-card";
import { useDemo } from "@/features/demo/demo-provider";
import { formatMoney } from "@/lib/format";
import { products } from "@/mocks/products";

export function CartView() {
  const { cart, removeFromCart, updateCartQuantity } = useDemo();
  const [error, setError] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const totals = calculateCartTotals(cart);
  const recommendations = products
    .filter(
      (product) =>
        product.status === "active" &&
        !cart.some((line) => line.product.id === product.id),
    )
    .slice(0, 3);

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

  if (cart.length === 0)
    return (
      <div className="border-forest/20 rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center">
        <PackageCheck
          aria-hidden="true"
          className="text-coral mx-auto size-8"
        />
        <p className="font-display text-forest mt-5 text-4xl">
          Tu cesta está esperando
        </p>
        <p className="text-ink-muted mx-auto mt-3 max-w-md text-sm">
          Explora por categoría o necesidad y guarda aquí los productos que
          quieras comparar.
        </p>
        <Button asChild className="mt-7">
          <Link href="/parafarmacia">Explorar productos</Link>
        </Button>
      </div>
    );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_23rem]">
        <section aria-labelledby="cart-products">
          <h2 className="sr-only" id="cart-products">
            Productos en la cesta
          </h2>
          <div className="grid gap-3">
            {cart.map((line) => (
              <Card
                className="grid grid-cols-[6rem_1fr] gap-4 p-3 sm:grid-cols-[7rem_1fr_auto] sm:items-center"
                key={line.product.id}
              >
                <ProductVisual product={line.product} />
                <div>
                  <Link
                    className="text-ink-muted text-[.65rem] font-black tracking-[.11em] uppercase"
                    href={
                      line.product.brandSlug
                        ? `/marcas/${line.product.brandSlug}`
                        : "/marcas"
                    }
                  >
                    {line.product.brandOrLaboratory}
                  </Link>
                  <Link
                    className="text-forest mt-1 block text-base font-bold"
                    href={`/productos/${line.product.slug}`}
                  >
                    {line.product.name}
                  </Link>
                  <p className="text-ink-muted mt-1 text-xs">
                    {line.product.size ?? "Formato demo"}
                  </p>
                  <p className="text-forest mt-3 font-black">
                    {formatMoney(line.product.priceInCents * line.quantity)}
                  </p>
                </div>
                <div className="border-forest/10 col-span-2 flex items-center justify-between gap-2 border-t pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
                  <div className="border-forest/15 flex items-center rounded-full border">
                    <button
                      className="grid size-10 place-items-center disabled:opacity-30"
                      type="button"
                      aria-label={`Reducir ${line.product.name}`}
                      disabled={line.quantity <= 1}
                      onClick={() => update(line.product.id, line.quantity - 1)}
                    >
                      <Minus aria-hidden="true" className="size-4" />
                    </button>
                    <span
                      className="w-7 text-center text-sm font-bold"
                      aria-label={`${line.quantity} unidades`}
                    >
                      {line.quantity}
                    </span>
                    <button
                      className="grid size-10 place-items-center disabled:opacity-30"
                      type="button"
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
                  <div className="flex">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        href="/favoritos"
                        aria-label={`Guardar ${line.product.name} para después`}
                      >
                        <Bookmark aria-hidden="true" className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar ${line.product.name}`}
                      onClick={() => removeFromCart(line.product.id)}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {error ? (
            <p
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </section>

        <aside>
          <Card className="sticky top-40 p-6">
            <h2 className="font-display text-forest text-3xl">Resumen</h2>
            <div className="mt-5">
              <FreeShippingProgress totalInCents={totals.totalInCents} />
            </div>
            <dl className="mt-6 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Productos</dt>
                <dd>{formatMoney(totals.totalInCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Envío estimado</dt>
                <dd>
                  {totals.totalInCents >= 4900 ? "Gratis" : "Por calcular"}
                </dd>
              </div>
              <div className="border-forest/10 text-forest mt-2 flex justify-between border-t pt-4 text-lg font-black">
                <dt>Total</dt>
                <dd>{formatMoney(totals.totalInCents)}</dd>
              </div>
              <p className="text-ink-muted text-[.65rem]">
                IVA incluido · sin cobro real
              </p>
            </dl>
            <form
              className="border-forest/10 mt-5 border-t pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                setPromoMessage(
                  "Código reconocido como demo; no se ha aplicado un descuento real.",
                );
              }}
            >
              <label className="field-label" htmlFor="promo-code">
                <Tag aria-hidden="true" className="mr-1 inline size-3.5" />{" "}
                Código promocional
              </label>
              <div className="flex gap-2">
                <input
                  id="promo-code"
                  className="border-forest/15 min-w-0 flex-1 rounded-full border bg-white px-4 text-xs"
                  placeholder="PICUAL10"
                />
                <Button size="sm" variant="outline">
                  Aplicar
                </Button>
              </div>
              {promoMessage ? (
                <p className="text-ink-muted mt-2 text-[.65rem]" role="status">
                  {promoMessage}
                </p>
              ) : null}
            </form>
            <Button asChild className="mt-6 w-full" size="lg">
              <Link href="/solicitud-pedido">
                <LockKeyhole aria-hidden="true" className="size-4" />
                Finalizar compra demo
              </Link>
            </Button>
            <p className="text-ink-muted mt-3 text-center text-[.65rem]">
              Compra como invitado · no necesitas crear una cuenta
            </p>
          </Card>
        </aside>
      </div>
      <section className="mt-16">
        <p className="eyebrow">Completa tu cesta</p>
        <h2 className="display-title text-forest mt-3 text-4xl">
          También puede venirte bien
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
