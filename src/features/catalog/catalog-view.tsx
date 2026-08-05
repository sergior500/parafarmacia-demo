"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category, Product, ProductSort } from "@/domain/product/product";
import { filterProducts } from "@/domain/product/product";
import { ProductCard } from "@/features/catalog/product-card";
import { useDemo } from "@/features/demo/demo-provider";

const PAGE_SIZE = 12;

export function CatalogView({
  products,
  categories,
  title,
  description,
  initialCategorySlug,
}: {
  products: Product[];
  categories: Category[];
  title: string;
  description: string;
  initialCategorySlug?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hydrated } = useDemo();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [available, setAvailable] = useState(
    searchParams.get("disponible") === "1",
  );

  const categorySlug =
    searchParams.get("categoria") ?? initialCategorySlug ?? "";
  const category = categories.find((item) => item.slug === categorySlug);
  const sortParam = searchParams.get("orden");
  const selectedSort: ProductSort =
    sortParam === "price-asc" || sortParam === "price-desc"
      ? sortParam
      : "name";
  const requestedPage = Number(searchParams.get("pagina") ?? "1");

  const filtered = useMemo(
    () =>
      filterProducts(products, {
        query: searchParams.get("q") ?? "",
        category: category?.id,
        available,
        sort: selectedSort,
      }),
    [available, category?.id, products, searchParams, selectedSort],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(
    totalPages,
    Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1),
  );
  const visibleProducts = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function updateParams(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!Object.hasOwn(changes, "pagina")) params.delete("pagina");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <section className="border-forest/8 relative overflow-hidden border-b bg-[radial-gradient(circle_at_85%_15%,#dff1e9_0,transparent_31%),linear-gradient(135deg,#fff_0%,#f2f5ef_100%)]">
        <span className="absolute top-1/2 right-[-5rem] size-56 -translate-y-1/2 rounded-full border-[2.5rem] border-white/55" />
        <div className="page-shell relative py-14 md:py-20">
          <p className="eyebrow">Catálogo online</p>
          <h1 className="display-title text-forest mt-4 max-w-3xl text-5xl md:text-7xl">
            {title}
          </h1>
          <p className="text-ink-muted mt-5 max-w-2xl text-base leading-relaxed md:text-lg">
            {description}
          </p>
        </div>
      </section>

      <section className="page-shell py-10 md:py-12">
        <form
          className="border-forest/8 rounded-[1.8rem] border bg-white p-4 shadow-[0_22px_65px_-42px_rgba(18,63,56,.48)] md:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            updateParams({ q: query.trim() });
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="text-forest flex items-center gap-2 text-xs font-extrabold tracking-[0.08em] uppercase">
              <span className="bg-sage grid size-8 place-items-center rounded-xl">
                <SlidersHorizontal aria-hidden="true" className="size-4" />
              </span>
              Buscar y filtrar
            </div>
            <span className="text-ink-muted hidden text-[0.65rem] font-semibold sm:block">
              Referencias y datos de demostración
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex gap-2">
              <Input
                aria-label="Buscar por nombre, laboratorio o código nacional"
                disabled={!hydrated}
                placeholder="Nombre, laboratorio o código"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Button
                disabled={!hydrated}
                size="icon"
                type="submit"
                aria-label="Buscar"
              >
                <Search aria-hidden="true" className="size-4" />
              </Button>
            </div>
            <select
              aria-label="Filtrar por categoría"
              disabled={!hydrated}
              className="border-forest/15 text-ink focus:border-forest focus:ring-sage min-h-12 rounded-2xl border bg-[#fafbf8] px-4 text-sm outline-none focus:ring-3"
              value={categorySlug}
              onChange={(event) =>
                updateParams({ categoria: event.target.value })
              }
            >
              <option value="">Todas las categorías</option>
              {categories.map((item) => (
                <option value={item.slug} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Ordenar productos"
              disabled={!hydrated}
              className="border-forest/15 text-ink focus:border-forest focus:ring-sage min-h-12 rounded-2xl border bg-[#fafbf8] px-4 text-sm outline-none focus:ring-3"
              value={selectedSort}
              onChange={(event) => updateParams({ orden: event.target.value })}
            >
              <option value="name">Nombre</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
          </div>
          <label className="text-forest mt-3 inline-flex min-h-10 cursor-pointer items-center gap-3 text-xs font-bold">
            <input
              checked={available}
              disabled={!hydrated}
              className="accent-forest size-4.5"
              type="checkbox"
              onChange={(event) => {
                setAvailable(event.target.checked);
                updateParams({
                  disponible: event.target.checked ? "1" : "",
                });
              }}
            />
            Mostrar solo disponibles
          </label>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-ink-muted text-sm">
            <strong className="text-ink">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "resultado" : "resultados"}
          </p>
          {searchParams.toString() ? (
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setAvailable(false);
                router.replace(pathname);
              }}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>

        {visibleProducts.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border-forest/25 mt-6 rounded-3xl border border-dashed bg-white px-6 py-16 text-center">
            <p className="font-display text-forest text-3xl">
              No encontramos productos
            </p>
            <p className="text-ink-muted mt-2">
              Prueba a quitar algún filtro o utiliza otra búsqueda.
            </p>
          </div>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Paginación del catálogo"
            className="mt-10 flex justify-center gap-2"
          >
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  size="icon"
                  variant={pageNumber === page ? "default" : "outline"}
                  aria-current={pageNumber === page ? "page" : undefined}
                  onClick={() => updateParams({ pagina: String(pageNumber) })}
                >
                  {pageNumber}
                </Button>
              ),
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}
