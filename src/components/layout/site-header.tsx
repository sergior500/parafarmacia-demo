"use client";

import {
  ChevronDown,
  Heart,
  Leaf,
  Menu,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useDemo } from "@/features/demo/demo-provider";
import { SearchAutocomplete } from "@/features/search/search-autocomplete";
import { pharmacyConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { categories } from "@/mocks/products";

const mainNavigation = [
  { href: "/parafarmacia", label: "Todos los productos" },
  { href: "/categorias/cuidado-facial", label: "Dermocosmética" },
  { href: "/categorias/proteccion-solar", label: "Protección solar" },
  { href: "/categorias/higiene-diaria", label: "Higiene" },
  { href: "/categorias/cuidado-infantil", label: "Bebé" },
  { href: "/categorias/higiene-bucal", label: "Bucodental" },
  { href: "/marcas", label: "Marcas" },
  { href: "/consejos", label: "Consejos" },
] as const;

export function SiteHeader() {
  const { cartCount } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-forest/8 bg-cream/95 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="bg-petrol text-white">
        <div className="page-shell flex min-h-8 items-center justify-center gap-x-8 text-[.65rem] font-bold sm:justify-between">
          <span>Envío gratuito desde 49 €</span>
          <span className="hidden sm:inline">Entrega estimada 24–48 h</span>
          <span className="hidden md:inline">
            Atención cercana de lunes a viernes
          </span>
          <span className="hidden lg:inline">
            Compra segura · condiciones visibles
          </span>
        </div>
      </div>

      <div className="page-shell grid min-h-[5.25rem] grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-7">
        <Link
          className="text-forest flex items-center gap-3"
          href="/"
          aria-label={`${pharmacyConfig.name}, inicio`}
        >
          <span className="bg-forest text-cream grid size-11 place-items-center rounded-[1.1rem] shadow-[0_14px_30px_-15px_rgba(9,45,41,.8)]">
            <Leaf aria-hidden="true" className="size-5" />
          </span>
          <span className="hidden sm:block">
            <strong className="font-display block text-xl leading-none font-semibold tracking-[-.04em]">
              {pharmacyConfig.name}
            </strong>
            <span className="text-ink-muted mt-1 block text-[.56rem] font-black tracking-[.14em] uppercase">
              Parafarmacia contemporánea
            </span>
          </span>
        </Link>

        <div className="hidden justify-center md:flex">
          <SearchAutocomplete compact id="desktop-header-search" />
        </div>

        <div className="flex items-center justify-end gap-1">
          <Link
            className="hover:bg-sage text-forest hidden min-h-11 min-w-11 items-center justify-center rounded-full transition-colors sm:flex"
            href="/cuenta"
            aria-label="Mi cuenta"
          >
            <UserRound aria-hidden="true" className="size-5" />
          </Link>
          <Link
            className="hover:bg-sage text-forest hidden min-h-11 min-w-11 items-center justify-center rounded-full transition-colors sm:flex"
            href="/favoritos"
            aria-label="Favoritos"
          >
            <Heart aria-hidden="true" className="size-5" />
          </Link>
          <Link
            className="hover:bg-sage text-forest relative flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors"
            href="/carrito"
            aria-label={`Carrito, ${cartCount} unidades`}
          >
            <ShoppingBag aria-hidden="true" className="size-5" />
            {cartCount ? (
              <span className="bg-coral ring-cream absolute top-0 right-0 grid size-5 place-items-center rounded-full text-[.6rem] font-black text-white ring-2">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <button
            className="hover:bg-sage text-forest grid size-11 place-items-center rounded-full lg:hidden"
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="page-shell pb-3 md:hidden">
        <SearchAutocomplete compact id="mobile-header-search" />
      </div>

      <nav
        className="border-forest/8 hidden border-t lg:block"
        aria-label="Navegación principal"
      >
        <ul className="page-shell flex min-h-11 items-center justify-center gap-1">
          {mainNavigation.map((item, index) => (
            <li key={item.href}>
              <Link
                className={cn(
                  "text-forest hover:bg-sage/65 flex min-h-9 items-center gap-1 rounded-full px-3.5 text-[.76rem] font-bold transition-colors",
                  index === 0 && "pl-4",
                )}
                href={item.href}
              >
                {item.label}
                {index === 0 ? (
                  <ChevronDown aria-hidden="true" className="size-3" />
                ) : null}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link
              className="text-coral text-[.76rem] font-black"
              href="/parafarmacia?orden=price-asc"
            >
              Ofertas demo
            </Link>
          </li>
        </ul>
      </nav>

      <nav
        className={cn(
          "border-forest/10 bg-cream absolute inset-x-0 top-full z-50 h-[calc(100dvh-8.5rem)] overflow-y-auto border-t px-4 py-6 shadow-2xl lg:hidden",
          !open && "hidden",
        )}
        aria-label="Navegación móvil"
      >
        <div className="page-shell">
          <p className="eyebrow">Explora la tienda</p>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  className="border-forest/8 text-forest block min-h-20 rounded-2xl border bg-white p-4 text-sm font-bold"
                  href={`/categorias/${category.slug}`}
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="border-forest/10 mt-6 grid gap-1 border-t pt-5">
            {[
              ...mainNavigation.slice(5),
              { href: "/cuenta", label: "Mi cuenta" },
              { href: "/favoritos", label: "Favoritos" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  className="text-forest block rounded-xl px-3 py-3 font-bold"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
