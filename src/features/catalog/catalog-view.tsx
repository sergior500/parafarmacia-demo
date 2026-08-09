"use client";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type Category,
  filterProducts,
  type Product,
  type ProductSort,
} from "@/domain/product/product";
import { buildAllCategoriesHref } from "@/features/catalog/catalog-navigation";
import { getPaginationItems } from "@/features/catalog/catalog-pagination";
import { ProductCard } from "@/features/catalog/product-card";
import { useDemo } from "@/features/demo/demo-provider";
import { cn } from "@/lib/utils";
import { brands, needs } from "@/mocks/content";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categorySlug =
    searchParams.get("categoria") ?? initialCategorySlug ?? "";
  const category = categories.find((item) => item.slug === categorySlug);
  const selectedBrand = searchParams.get("marca") ?? "";
  const selectedNeed = searchParams.get("necesidad") ?? "";
  const available = searchParams.get("disponible") === "1";
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
        brand: selectedBrand || undefined,
        need: selectedNeed || undefined,
      }),
    [
      available,
      category?.id,
      products,
      searchParams,
      selectedBrand,
      selectedNeed,
      selectedSort,
    ],
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
  const visiblePaginationItems = getPaginationItems(page, totalPages);
  const availableBrands = brands.filter((brand) =>
    products.some(
      (product) =>
        product.brandSlug === brand.slug &&
        (!category || product.categoryId === category.id),
    ),
  );
  const relatedNeeds = needs.filter(
    (need) => !categorySlug || need.categorySlug === categorySlug,
  );
  const hasFilters = Boolean(searchParams.toString());

  function updateParams(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!Object.hasOwn(changes, "pagina")) params.delete("pagina");
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function showAllCategories() {
    router.replace(
      buildAllCategoriesHref({
        pathname,
        search: searchParams.toString(),
        hasInitialCategory: Boolean(initialCategorySlug),
      }),
      { scroll: false },
    );
  }

  const filterPanel = (
    <div className="grid gap-6">
      <div>
        <p className="text-forest text-sm font-black">Categoría</p>
        <div className="mt-3 grid gap-1">
          <button
            className={cn(
              "rounded-xl px-3 py-2 text-left text-xs font-bold",
              !categorySlug ? "bg-sage text-forest" : "text-ink-muted",
            )}
            onClick={showAllCategories}
          >
            Todas
          </button>
          {categories.map((item) => (
            <button
              className={cn(
                "rounded-xl px-3 py-2 text-left text-xs font-bold",
                categorySlug === item.slug
                  ? "bg-sage text-forest"
                  : "text-ink-muted hover:bg-cream",
              )}
              key={item.id}
              onClick={() => updateParams({ categoria: item.slug })}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <div className="border-forest/10 border-t pt-5">
        <p className="text-forest text-sm font-black">Marca</p>
        <select
          aria-label="Filtrar por marca"
          className="border-forest/15 mt-3 min-h-11 w-full rounded-xl border bg-white px-3 text-xs"
          value={selectedBrand}
          onChange={(event) => updateParams({ marca: event.target.value })}
        >
          <option value="">Todas las marcas</option>
          {availableBrands.map((brand) => (
            <option key={brand.id} value={brand.slug}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      <div className="border-forest/10 border-t pt-5">
        <p className="text-forest text-sm font-black">Necesidad</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {needs.map((need) => (
            <button
              className={cn(
                "rounded-full border px-3 py-2 text-[.68rem] font-bold",
                selectedNeed === need.slug
                  ? "border-forest bg-forest text-white"
                  : "border-forest/10 text-forest bg-white",
              )}
              key={need.slug}
              onClick={() =>
                updateParams({
                  necesidad: selectedNeed === need.slug ? "" : need.slug,
                })
              }
            >
              {need.name}
            </button>
          ))}
        </div>
      </div>
      <label className="border-forest/10 text-forest flex min-h-11 cursor-pointer items-center gap-3 border-t pt-5 text-xs font-bold">
        <input
          checked={available}
          className="accent-forest size-4.5"
          type="checkbox"
          onChange={(event) =>
            updateParams({ disponible: event.target.checked ? "1" : "" })
          }
        />
        Mostrar solo disponibles
      </label>
    </div>
  );

  return (
    <>
      <section className="page-shell pt-4">
        <Breadcrumbs items={[{ label: title }]} />
      </section>
      <section className="page-shell grid gap-8 pt-3 pb-14 lg:grid-cols-[.68fr_1.32fr] lg:items-end">
        <div>
          <p className="eyebrow">Catálogo de parafarmacia</p>
          <h1 className="display-title text-forest mt-3 text-5xl md:text-7xl">
            {title}
          </h1>
        </div>
        <div>
          <p className="text-ink-muted max-w-2xl text-sm leading-relaxed md:text-base">
            {description}
          </p>
          {relatedNeeds.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {relatedNeeds.map((need) => (
                <Link
                  className="border-forest/10 text-forest rounded-full border bg-white px-3 py-2 text-xs font-bold"
                  href={`/buscar?necesidad=${need.slug}`}
                  key={need.slug}
                >
                  {need.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-forest/8 border-y bg-white/70">
        <div className="page-shell flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <form
            className="border-forest/15 flex min-h-11 flex-1 items-center rounded-full border bg-white"
            onSubmit={(event) => {
              event.preventDefault();
              updateParams({ q: query.trim() });
            }}
          >
            <Search aria-hidden="true" className="text-ink-muted ml-4 size-4" />
            <Input
              aria-label="Buscar por nombre, marca o código"
              className="min-h-10 border-0 bg-transparent shadow-none focus:ring-0"
              disabled={!hydrated}
              placeholder="Buscar en esta selección"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="text-forest mr-1 rounded-full px-3 py-2 text-xs font-black"
              type="submit"
            >
              Buscar
            </button>
          </form>
          <Button
            className="lg:hidden"
            variant="outline"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" /> Filtros
          </Button>
          <label className="sr-only" htmlFor="catalog-sort">
            Ordenar productos
          </label>
          <div className="relative">
            <select
              id="catalog-sort"
              aria-label="Ordenar productos"
              className="border-forest/15 min-h-11 w-full appearance-none rounded-full border bg-white pr-10 pl-4 text-xs font-bold sm:w-auto"
              value={selectedSort}
              onChange={(event) => updateParams({ orden: event.target.value })}
            >
              <option value="name">Relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="text-ink-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            />
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-8 py-10 lg:grid-cols-[14rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-40">
            {filterPanel}
            {hasFilters ? (
              <Button
                className="mt-5 w-full"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  router.replace(pathname);
                }}
              >
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        </aside>
        <div>
          <div className="flex items-center justify-between gap-3">
            <p aria-live="polite" className="text-ink-muted text-sm">
              <strong className="text-ink">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "producto" : "productos"}
            </p>
            {hasFilters ? (
              <span className="text-ink-muted flex items-center gap-1 text-[.65rem]">
                <Check aria-hidden="true" className="size-3.5" /> Filtros
                aplicados
              </span>
            ) : null}
          </div>
          {visibleProducts.length ? (
            <div className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border-forest/20 mt-6 rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center">
              <p className="font-display text-forest text-3xl">
                No encontramos esa combinación
              </p>
              <p className="text-ink-muted mt-2 text-sm">
                Prueba con una palabra más general o elimina algún filtro.
              </p>
              <Button
                className="mt-5"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  router.replace(pathname);
                }}
              >
                Ver todos
              </Button>
            </div>
          )}
          {totalPages > 1 ? (
            <nav
              aria-label="Paginación del catálogo"
              className="mt-12 flex items-center justify-center gap-2"
            >
              <Button
                aria-label="Ir a la página anterior"
                disabled={page === 1}
                onClick={() => updateParams({ pagina: String(page - 1) })}
                size="icon"
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              {visiblePaginationItems.map((item) =>
                typeof item === "number" ? (
                  <Button
                    key={item}
                    size="icon"
                    variant={item === page ? "default" : "outline"}
                    aria-current={item === page ? "page" : undefined}
                    aria-label={`Ir a la página ${item}`}
                    onClick={() => updateParams({ pagina: String(item) })}
                  >
                    {item}
                  </Button>
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-ink-muted grid size-7 place-items-center text-sm font-bold sm:size-10"
                    key={item}
                  >
                    …
                  </span>
                ),
              )}
              <Button
                aria-label="Ir a la página siguiente"
                disabled={page === totalPages}
                onClick={() => updateParams({ pagina: String(page + 1) })}
                size="icon"
                variant="outline"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </nav>
          ) : null}
        </div>
      </section>

      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          !filtersOpen && "hidden",
        )}
      >
        <button
          className="absolute inset-0 bg-black/35"
          aria-label="Cerrar filtros"
          onClick={() => setFiltersOpen(false)}
        />
        <aside className="bg-cream absolute right-0 bottom-0 left-0 max-h-[86vh] overflow-y-auto rounded-t-[2rem] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-forest text-3xl">
              Filtrar productos
            </h2>
            <button
              className="grid size-11 place-items-center rounded-full bg-white"
              onClick={() => setFiltersOpen(false)}
              aria-label="Cerrar filtros"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          {filterPanel}
          <Button className="mt-7 w-full" onClick={() => setFiltersOpen(false)}>
            Ver {filtered.length} resultados
          </Button>
        </aside>
      </div>
    </>
  );
}
