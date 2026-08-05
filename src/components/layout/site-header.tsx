"use client";

import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useDemo } from "@/features/demo/demo-provider";
import { pharmacyConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/parafarmacia", label: "Tienda" },
  { href: "/categorias/cuidado-facial", label: "Cuidado facial" },
  { href: "/categorias/proteccion-solar", label: "Protección solar" },
  { href: "/como-comprar", label: "Cómo comprar" },
];

export function SiteHeader() {
  const { cartCount } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-forest/8 bg-cream/88 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="page-shell flex min-h-[4.75rem] items-center justify-between gap-5">
        <Link
          href="/"
          className="text-forest flex items-center gap-3"
          aria-label={`${pharmacyConfig.name}, inicio`}
        >
          <span
            aria-hidden="true"
            className="bg-forest relative grid size-10 place-items-center rounded-xl shadow-[0_8px_20px_-10px_rgba(9,45,41,.8)]"
          >
            <span className="absolute h-5 w-1.5 rounded-full bg-white" />
            <span className="absolute h-1.5 w-5 rounded-full bg-white" />
          </span>
          <span className="hidden leading-[1.05] sm:block">
            <span className="font-display block text-[1.05rem] font-bold tracking-[-0.03em]">
              {pharmacyConfig.name}
            </span>
            <span className="text-ink-muted mt-1 block text-[0.58rem] font-bold tracking-[0.15em] uppercase">
              Farmacia digital · Sevilla
            </span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden lg:block">
          <ul className="border-forest/8 flex items-center gap-1 rounded-full border bg-white/75 p-1 shadow-sm">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  className="text-forest hover:bg-sage/70 block rounded-full px-4 py-2 text-[0.8rem] font-semibold transition-colors"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            asChild
            className="border-forest/10 bg-white"
            size="icon"
            variant="outline"
          >
            <Link href="/buscar" aria-label="Buscar productos">
              <Search aria-hidden="true" className="size-5" />
            </Link>
          </Button>
          <Button
            asChild
            className="border-forest/10 bg-white"
            size="icon"
            variant="outline"
          >
            <Link href="/carrito" aria-label={`Carrito, ${cartCount} unidades`}>
              <ShoppingBag aria-hidden="true" className="size-5" />
              {cartCount > 0 ? (
                <span className="bg-coral absolute mt-[-1.9rem] ml-8 grid size-5 place-items-center rounded-full text-[0.6rem] text-white ring-2 ring-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Button>
          <Button
            className="border-forest/10 bg-white lg:hidden"
            size="icon"
            variant="outline"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>
      <nav
        aria-label="Navegación móvil"
        className={cn(
          "border-forest/10 bg-cream border-t px-4 py-4 shadow-xl lg:hidden",
          !open && "hidden",
        )}
      >
        <ul className="page-shell grid gap-1">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                className="text-forest hover:bg-sage block rounded-xl px-4 py-3 font-semibold"
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              className="text-forest hover:bg-sage block rounded-xl px-4 py-3 font-semibold"
              href="/admin"
              onClick={() => setOpen(false)}
            >
              Panel interno demo
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
