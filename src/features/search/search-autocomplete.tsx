"use client";

import { ArrowRight, Clock3, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { categories, products } from "@/mocks/products";

export function SearchAutocomplete({
  compact = false,
  id,
}: {
  compact?: boolean;
  id?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const normalized = query.trim().toLocaleLowerCase("es");
  const productMatches = useMemo(
    () =>
      normalized
        ? products
            .filter(
              (product) =>
                product.status !== "withdrawn" &&
                [
                  product.name,
                  product.brandOrLaboratory,
                  ...(product.needs ?? []),
                ]
                  .join(" ")
                  .toLocaleLowerCase("es")
                  .includes(normalized),
            )
            .slice(0, 4)
        : products
            .filter(
              (product) => product.featured && product.status !== "withdrawn",
            )
            .slice(0, 3),
    [normalized],
  );
  const categoryMatches = categories
    .filter((category) =>
      normalized
        ? `${category.name} ${category.description}`
            .toLocaleLowerCase("es")
            .includes(normalized)
        : true,
    )
    .slice(0, 3);
  const open = focused;
  const inputId = id ?? (compact ? "header-search" : "hero-search");

  function submit(value = query) {
    const clean = value.trim();
    router.push(clean ? `/buscar?q=${encodeURIComponent(clean)}` : "/buscar");
    setFocused(false);
  }

  return (
    <div className={cn("relative", compact ? "w-full max-w-xl" : "w-full")}>
      <form
        className={cn(
          "border-forest/15 focus-within:border-forest focus-within:ring-sage flex items-center rounded-full border bg-white shadow-[0_12px_30px_-20px_rgba(10,56,52,.55)] focus-within:ring-4",
          compact ? "min-h-11" : "min-h-14",
        )}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Search
          aria-hidden="true"
          className="text-ink-muted ml-4 size-5 shrink-0"
        />
        <label className="sr-only" htmlFor={inputId}>
          Buscar productos, marcas o necesidades
        </label>
        <input
          id={inputId}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-stone-400"
          placeholder={
            compact
              ? "¿Qué estás buscando?"
              : "Prueba “piel sensible” o “protector solar”…"
          }
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 160)}
        />
        {query ? (
          <button
            className="text-ink-muted hover:text-forest grid size-10 place-items-center"
            type="button"
            aria-label="Borrar búsqueda"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setQuery("")}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
        <button
          className="bg-forest hover:bg-forest-light mr-1.5 grid size-10 place-items-center rounded-full text-white transition-colors"
          type="submit"
          aria-label="Buscar"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </form>

      {open ? (
        <div className="border-forest/10 absolute top-[calc(100%+.65rem)] right-0 left-0 z-50 overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_28px_80px_-30px_rgba(9,45,41,.55)]">
          <div className="grid max-h-[70vh] overflow-y-auto md:grid-cols-[1fr_.72fr]">
            <div className="p-4 sm:p-5">
              <p className="text-ink-muted text-[.65rem] font-black tracking-[.14em] uppercase">
                {normalized ? "Productos sugeridos" : "Fichas destacadas"}
              </p>
              <div className="mt-3 grid gap-1">
                {productMatches.length ? (
                  productMatches.map((product) => (
                    <button
                      className="hover:bg-cream flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors"
                      key={product.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => router.push(`/productos/${product.slug}`)}
                    >
                      <span className="bg-sage text-forest grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black">
                        {product.name.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <strong className="text-forest block truncate text-sm">
                          {product.name}
                        </strong>
                        <span className="text-ink-muted text-xs">
                          {product.brandOrLaboratory}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="bg-cream rounded-xl p-4">
                    <strong className="text-forest text-sm">
                      No vemos una coincidencia exacta
                    </strong>
                    <p className="text-ink-muted mt-1 text-xs">
                      Prueba con una necesidad, una categoría o una palabra más
                      corta.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-cream/75 border-forest/8 border-t p-4 sm:p-5 md:border-t-0 md:border-l">
              <p className="text-ink-muted text-[.65rem] font-black tracking-[.14em] uppercase">
                Categorías relacionadas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryMatches.map((category) => (
                  <button
                    className="border-forest/10 text-forest rounded-full border bg-white px-3 py-2 text-xs font-bold"
                    key={category.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => router.push(`/categorias/${category.slug}`)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              {!normalized ? (
                <div className="mt-6">
                  <p className="text-ink-muted flex items-center gap-2 text-[.65rem] font-black tracking-[.14em] uppercase">
                    <Clock3 aria-hidden="true" className="size-3.5" /> Búsquedas
                    frecuentes
                  </p>
                  <div className="mt-3 grid gap-2">
                    {[
                      "Protector solar facial",
                      "Piel sensible",
                      "Cuidado del bebé",
                    ].map((item) => (
                      <button
                        className="text-forest flex items-center gap-2 text-left text-xs font-bold"
                        key={item}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => submit(item)}
                      >
                        <Sparkles
                          aria-hidden="true"
                          className="text-coral size-3.5"
                        />{" "}
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
