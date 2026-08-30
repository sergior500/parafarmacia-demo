"use client";

import {
  ChevronDown,
  ChevronRight,
  Heart,
  Menu,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { calculateCartTotals } from "@/domain/cart/cart";
import { SearchAutocomplete } from "@/features/search/search-autocomplete";
import { useStorefront } from "@/features/storefront/storefront-provider";
import { pharmacyConfig } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { categories } from "@/mocks/products";

const mainNavigation = [
  { href: "/marcas", label: "Marcas" },
  { href: "/consejos", label: "Consejos" },
  { href: "/sobre-la-farmacia", label: "La farmacia" },
  { href: "/envios", label: "Envíos" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function SiteHeader() {
  const { cart, cartCount, hydrated } = useStorefront();
  const [open, setOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<
    "catalog" | "account" | "cart" | null
  >(null);
  const cartTotal = calculateCartTotals(cart).totalInCents;

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-header-dropdown]")
      ) {
        return;
      }
      setActiveMenu(null);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveMenu(null);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function toggleMenu(menu: "catalog" | "account" | "cart") {
    setOpen(false);
    setActiveMenu((current) => (current === menu ? null : menu));
  }

  function closeMenus() {
    setActiveMenu(null);
    setOpen(false);
  }

  return (
    <header className="border-forest/10 bg-cream/95 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="bg-forest-dark text-white">
        <div className="page-shell flex min-h-8 items-center justify-center gap-x-8 text-[.66rem] font-semibold sm:justify-between">
          <span>Farmacia Picual · Parafarmacia online</span>
          <span className="hidden sm:inline">
            Información clara para elegir
          </span>
          <span className="hidden md:inline">Compra protegida por Shopify</span>
        </div>
      </div>

      <div className="page-shell grid min-h-[5.25rem] grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-7">
        <Link
          className="text-forest flex items-center gap-3"
          href="/"
          aria-label={`${pharmacyConfig.name}, inicio`}
        >
          <span className="brand-seal size-12 text-[.92rem]">FP</span>
          <span className="hidden sm:block">
            <strong className="font-display block text-[1.32rem] leading-none font-semibold tracking-[-.05em]">
              {pharmacyConfig.name}
            </strong>
            <span className="text-ink-muted mt-1 block text-[.56rem] font-black tracking-[.14em] uppercase">
              Parafarmacia online
            </span>
          </span>
        </Link>

        <div className="hidden justify-center md:flex">
          <SearchAutocomplete compact id="desktop-header-search" />
        </div>

        <div className="flex items-center justify-end gap-1">
          <div className="relative hidden sm:block" data-header-dropdown>
            <button
              className={cn(
                "hover:bg-sage text-forest flex min-h-11 min-w-11 items-center justify-center gap-0.5 rounded-full transition-colors",
                activeMenu === "account" && "bg-sage",
              )}
              type="button"
              aria-label="Abrir menú de usuario"
              aria-haspopup="true"
              aria-expanded={activeMenu === "account"}
              aria-controls="header-account-menu"
              onClick={() => toggleMenu("account")}
            >
              <UserRound aria-hidden="true" className="size-5" />
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-3 transition-transform",
                  activeMenu === "account" && "rotate-180",
                )}
              />
            </button>
            {activeMenu === "account" ? (
              <div
                className="border-forest/10 absolute top-full right-0 z-[70] mt-2 w-72 border bg-[#fbf9f3] p-3 shadow-[0_24px_70px_-28px_rgba(16,42,33,.55)]"
                id="header-account-menu"
              >
                <div className="border-forest/10 border-b px-3 pt-2 pb-4">
                  <p className="eyebrow">Tu espacio Picual</p>
                  <p className="text-ink-muted mt-1 text-xs">
                    Consulta tus datos, pedidos y productos guardados.
                  </p>
                </div>
                <div className="grid gap-1 pt-2">
                  <Link
                    className="hover:bg-sage/70 text-forest flex items-center justify-between px-3 py-3 text-sm font-bold"
                    href="/cuenta"
                    onClick={closeMenus}
                  >
                    Mi cuenta
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                  <Link
                    className="hover:bg-sage/70 text-forest flex items-center justify-between px-3 py-3 text-sm font-bold"
                    href="/favoritos"
                    onClick={closeMenus}
                  >
                    Mis favoritos
                    <Heart aria-hidden="true" className="size-4" />
                  </Link>
                  <Link
                    className="hover:bg-sage/70 text-forest flex items-center justify-between px-3 py-3 text-sm font-bold"
                    href="/contacto"
                    onClick={closeMenus}
                  >
                    Ayuda y contacto
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
          <Link
            className="hover:bg-sage text-forest hidden min-h-11 min-w-11 items-center justify-center rounded-full transition-colors sm:flex"
            href="/favoritos"
            aria-label="Favoritos"
          >
            <Heart aria-hidden="true" className="size-5" />
          </Link>
          <div className="relative" data-header-dropdown>
            <button
              className={cn(
                "hover:bg-sage text-forest relative flex min-h-11 min-w-11 items-center justify-center gap-0.5 rounded-full transition-colors",
                activeMenu === "cart" && "bg-sage",
              )}
              type="button"
              aria-label={`Abrir carrito, ${cartCount} unidades`}
              aria-haspopup="true"
              aria-expanded={activeMenu === "cart"}
              aria-controls="header-cart-menu"
              onClick={() => toggleMenu("cart")}
            >
              <ShoppingBag aria-hidden="true" className="size-5" />
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "hidden size-3 transition-transform sm:block",
                  activeMenu === "cart" && "rotate-180",
                )}
              />
              {cartCount ? (
                <span className="bg-coral ring-cream absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-[.6rem] font-black text-white ring-2">
                  {cartCount}
                </span>
              ) : null}
            </button>
            {activeMenu === "cart" ? (
              <div
                className="border-forest/10 fixed top-[7.25rem] right-4 left-4 z-[70] border bg-[#fbf9f3] p-4 shadow-[0_24px_70px_-28px_rgba(16,42,33,.55)] sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-[22rem]"
                id="header-cart-menu"
              >
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">Tu cesta</p>
                    <p className="text-forest mt-1 text-sm font-bold">
                      {cartCount
                        ? `${cartCount} ${cartCount === 1 ? "unidad" : "unidades"}`
                        : "Todavía está vacía"}
                    </p>
                  </div>
                  {cartCount ? (
                    <strong className="text-forest text-lg">
                      {formatMoney(cartTotal)}
                    </strong>
                  ) : null}
                </div>

                {!hydrated ? (
                  <p className="text-ink-muted mt-5 text-sm">
                    Recuperando tu cesta…
                  </p>
                ) : cart.length ? (
                  <div className="border-forest/10 mt-4 grid gap-3 border-y py-4">
                    {cart.slice(0, 3).map((line) => (
                      <Link
                        className="group grid grid-cols-[1fr_auto] gap-3"
                        href={`/productos/${line.product.slug}`}
                        key={line.product.id}
                        onClick={closeMenus}
                      >
                        <span>
                          <strong className="text-forest group-hover:text-coral line-clamp-1 block text-sm">
                            {line.product.name}
                          </strong>
                          <span className="text-ink-muted mt-0.5 block text-xs">
                            Cantidad: {line.quantity}
                          </span>
                        </span>
                        <span className="text-forest text-sm font-bold">
                          {formatMoney(
                            line.product.priceInCents * line.quantity,
                          )}
                        </span>
                      </Link>
                    ))}
                    {cart.length > 3 ? (
                      <p className="text-ink-muted text-xs">
                        Y {cart.length - 3} producto
                        {cart.length - 3 === 1 ? "" : "s"} más
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-ink-muted border-forest/10 mt-4 border-y py-5 text-sm">
                    Añade productos para ver aquí un resumen rápido antes de
                    comprar.
                  </p>
                )}

                <Link
                  className="bg-forest hover:bg-forest-light mt-4 flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-bold text-white"
                  href={cart.length ? "/carrito" : "/parafarmacia"}
                  onClick={closeMenus}
                >
                  {cart.length ? "Ver cesta completa" : "Explorar productos"}
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            ) : null}
          </div>
          <button
            className="hover:bg-sage text-forest grid size-11 place-items-center rounded-full lg:hidden"
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => {
              setActiveMenu(null);
              setOpen((value) => !value);
            }}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="page-shell pb-3 md:hidden">
        <SearchAutocomplete compact id="mobile-header-search" />
      </div>

      <nav
        className="border-forest/10 hidden border-t lg:block"
        aria-label="Navegación principal"
      >
        <ul className="page-shell flex min-h-11 items-center justify-center gap-1">
          <li className="relative" data-header-dropdown>
            <button
              className={cn(
                "text-forest hover:text-coral after:bg-coral relative flex min-h-10 items-center gap-1 px-4 text-[.74rem] font-bold transition-colors after:absolute after:right-4 after:bottom-0 after:left-4 after:h-px after:origin-left after:scale-x-0 after:transition-transform hover:after:scale-x-100",
                activeMenu === "catalog" && "text-coral after:scale-x-100",
              )}
              type="button"
              aria-haspopup="true"
              aria-expanded={activeMenu === "catalog"}
              aria-controls="header-catalog-menu"
              onClick={() => toggleMenu("catalog")}
            >
              Todos los productos
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-3 transition-transform",
                  activeMenu === "catalog" && "rotate-180",
                )}
              />
            </button>
            {activeMenu === "catalog" ? (
              <div
                className="border-forest/10 absolute top-full left-0 z-[70] mt-2 w-[42rem] border bg-[#fbf9f3] p-5 shadow-[0_24px_70px_-28px_rgba(16,42,33,.55)]"
                id="header-catalog-menu"
              >
                <div className="border-forest/10 flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="eyebrow">Catálogo completo</p>
                    <p className="text-ink-muted mt-1 text-xs">
                      Explora los productos por familia de cuidado.
                    </p>
                  </div>
                  <Link
                    className="text-forest hover:text-coral flex items-center gap-1 text-xs font-black"
                    href="/parafarmacia"
                    onClick={closeMenus}
                  >
                    Ver todo
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {categories.map((category, index) => (
                    <Link
                      className="hover:bg-sage/70 group min-h-24 p-3 transition-colors"
                      href={`/categorias/${category.slug}`}
                      key={category.id}
                      onClick={closeMenus}
                    >
                      <span className="catalog-number text-olive text-xs">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong className="text-forest group-hover:text-coral mt-2 block text-sm">
                        {category.name}
                      </strong>
                      <span className="text-ink-muted mt-1 line-clamp-2 block text-[.68rem] leading-relaxed">
                        {category.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </li>
          {mainNavigation.map((item) => (
            <li key={item.href}>
              <Link
                className="text-forest hover:text-coral after:bg-coral relative flex min-h-10 items-center gap-1 px-3.5 text-[.74rem] font-bold transition-colors after:absolute after:right-3.5 after:bottom-0 after:left-3.5 after:h-px after:origin-left after:scale-x-0 after:transition-transform hover:after:scale-x-100"
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link
              className="bg-coral text-cream hover:bg-forest rounded-full px-4 py-2 text-[.72rem] font-black transition-colors"
              href="/ofertas"
            >
              Ofertas
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
          <Link
            className="bg-forest text-cream mt-4 flex min-h-12 items-center justify-between px-4 text-sm font-black"
            href="/parafarmacia"
            onClick={closeMenus}
          >
            Todos los productos
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
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
              { href: "/ofertas", label: "Ofertas" },
              ...mainNavigation,
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
