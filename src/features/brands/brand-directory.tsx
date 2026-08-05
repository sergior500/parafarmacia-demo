"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Brand } from "@/domain/content/content";

export function BrandDirectory({ brands }: { brands: Brand[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("es");
  const orderedBrands = useMemo(
    () =>
      brands
        .filter((brand) =>
          `${brand.name} ${brand.description}`
            .toLocaleLowerCase("es")
            .includes(normalized),
        )
        .toSorted((a, b) => a.name.localeCompare(b.name, "es")),
    [brands, normalized],
  );
  const letters = [
    ...new Set(brands.map((brand) => brand.name.charAt(0).toUpperCase())),
  ].sort();

  return (
    <>
      <div className="border-forest/10 flex flex-col gap-4 rounded-[1.5rem] border bg-white p-4 sm:flex-row sm:items-center">
        <div className="border-forest/10 bg-cream flex min-h-11 flex-1 items-center rounded-full border px-4">
          <Search aria-hidden="true" className="text-ink-muted size-4" />
          <label className="sr-only" htmlFor="brand-search">
            Buscar una marca
          </label>
          <input
            id="brand-search"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            placeholder="Buscar una marca"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {!normalized ? (
          <nav aria-label="Índice alfabético" className="flex flex-wrap gap-1">
            {letters.map((letter) => (
              <a
                className="text-forest bg-sage grid size-9 place-items-center rounded-full text-xs font-black"
                href={`#marca-${letter}`}
                key={letter}
              >
                {letter}
              </a>
            ))}
          </nav>
        ) : (
          <p className="text-ink-muted text-xs" aria-live="polite">
            {orderedBrands.length} resultados
          </p>
        )}
      </div>
      {orderedBrands.length ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedBrands.map((brand) => (
            <Link
              className="border-forest/8 group min-h-48 rounded-[1.75rem] border p-6 transition-transform hover:-translate-y-1"
              href={`/marcas/${brand.slug}`}
              id={`marca-${brand.name.charAt(0).toUpperCase()}`}
              key={brand.id}
              style={{ backgroundColor: brand.accent }}
            >
              <span className="text-forest/40 text-[.62rem] font-black tracking-[.13em] uppercase">
                Marca
              </span>
              <h2 className="font-display text-forest mt-10 text-3xl tracking-[-.045em]">
                {brand.name}
              </h2>
              <p className="text-ink-muted mt-3 text-xs leading-relaxed">
                {brand.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-sage/45 mt-10 rounded-[1.75rem] p-8 text-center">
          <h2 className="font-display text-forest text-3xl">
            No encontramos esa marca
          </h2>
          <p className="text-ink-muted mt-2 text-sm">
            Prueba con menos letras o explora el catálogo completo.
          </p>
        </div>
      )}
    </>
  );
}
