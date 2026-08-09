"use client";

import {
  BadgeCheck,
  CheckCircle2,
  FileWarning,
  PackagePlus,
  ScanSearch,
  Search,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Product, ProductStatus } from "@/domain/product/product";
import { CatalogProductEditor } from "@/features/admin/catalog-product-editor";
import {
  applyCatalogReviewRecord,
  type CatalogReviewRecord,
  type CatalogReviewStatus,
  getCatalogReviewStatus,
  parseCatalogReviewRecords,
} from "@/features/admin/catalog-review-storage";
import { parseStoredProducts } from "@/features/demo/storage-validation";
import { formatMoney } from "@/lib/format";
import { categories, products as seededProducts } from "@/mocks/products";

const CUSTOM_PRODUCTS_KEY = "parafarmacia-demo-custom-products-v1";
const REVIEW_RECORDS_KEY = "parafarmacia-demo-catalog-review-v1";
const PAGE_SIZE = 25;

const reviewConfig: Record<
  CatalogReviewStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  pending: {
    label: "Pendiente",
    icon: FileWarning,
    className: "bg-amber-100 text-amber-800",
  },
  reviewed: {
    label: "Revisado",
    icon: ScanSearch,
    className: "bg-sky-100 text-sky-800",
  },
  published: {
    label: "Publicado",
    icon: BadgeCheck,
    className: "bg-emerald-100 text-emerald-800",
  },
};

const fieldClassName =
  "border-forest/15 text-ink focus:border-forest focus:ring-sage min-h-12 w-full rounded-2xl border bg-white px-4 text-sm shadow-sm outline-none focus:ring-3";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductsAdmin() {
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [reviewRecords, setReviewRecords] = useState<CatalogReviewRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- One-time hydration from demo-only browser storage. */
    setCustomProducts(
      parseStoredProducts(localStorage.getItem(CUSTOM_PRODUCTS_KEY)) ?? [],
    );
    setReviewRecords(
      parseCatalogReviewRecords(localStorage.getItem(REVIEW_RECORDS_KEY)),
    );
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const recordMap = useMemo(
    () => new Map(reviewRecords.map((record) => [record.productId, record])),
    [reviewRecords],
  );
  const catalogProducts = useMemo(
    () =>
      [...customProducts, ...seededProducts].map((product) =>
        applyCatalogReviewRecord(product, recordMap.get(product.id)),
      ),
    [customProducts, recordMap],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return catalogProducts.filter((product) => {
      const matchesQuery = normalizedQuery
        ? [product.name, product.brandOrLaboratory, product.ean ?? ""].some(
            (value) => value.toLocaleLowerCase("es").includes(normalizedQuery),
          )
        : true;
      const reviewStatus = getCatalogReviewStatus(
        product,
        recordMap.get(product.id),
      );
      return (
        matchesQuery &&
        (statusFilter === "all" || reviewStatus === statusFilter)
      );
    });
  }, [catalogProducts, query, recordMap, statusFilter]);

  const counts = useMemo(() => {
    const result: Record<CatalogReviewStatus, number> = {
      pending: 0,
      reviewed: 0,
      published: 0,
    };
    for (const product of catalogProducts) {
      result[getCatalogReviewStatus(product, recordMap.get(product.id))] += 1;
    }
    return result;
  }, [catalogProducts, recordMap]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const editingProduct = editingProductId
    ? catalogProducts.find((product) => product.id === editingProductId)
    : undefined;

  function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const stock = Number(formData.get("stock") ?? 0);
    const maximumUnits = Number(formData.get("maximumUnits") ?? 6);
    const status = String(
      formData.get("status") ?? "inactive",
    ) as ProductStatus;

    if (!name || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setNotice("Revisa el nombre, el precio y el stock antes de guardar.");
      return;
    }

    const id = crypto.randomUUID();
    const product: Product = {
      id: `local-${id}`,
      slug: `${slugify(name)}-${id.slice(0, 6)}`,
      status,
      name,
      shortDescription: String(formData.get("shortDescription") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      brandOrLaboratory:
        String(formData.get("brand") ?? "").trim() || "Amapola",
      priceInCents: Math.round(price * 100),
      taxRate: Number(formData.get("taxRate") ?? 21),
      currency: "EUR",
      imageUrl: String(formData.get("imageUrl") ?? "").trim(),
      categoryId: String(
        formData.get("categoryId") ?? categories[0]?.id ?? "cat-facial",
      ),
      ean: String(formData.get("ean") ?? "").trim() || undefined,
      stock,
      maximumUnitsPerOrder: Math.max(1, Math.round(maximumUnits || 1)),
      requiresSpecialTransport: false,
      availableForOnlineSale: false,
      size: String(formData.get("size") ?? "").trim() || undefined,
      badges: ["Alta manual"],
      dataReviewRequired: true,
    };

    setCustomProducts((current) => {
      const nextProducts = [product, ...current];
      localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(nextProducts));
      return nextProducts;
    });
    form.reset();
    setNotice(`${name} se ha añadido y queda pendiente de revisión.`);
    setShowForm(false);
    setEditingProductId(product.id);
  }

  function handleSaveReview(record: CatalogReviewRecord) {
    setReviewRecords((current) => {
      const nextRecords = [
        record,
        ...current.filter((item) => item.productId !== record.productId),
      ];
      localStorage.setItem(REVIEW_RECORDS_KEY, JSON.stringify(nextRecords));
      return nextRecords;
    });
    setNotice(
      record.reviewStatus === "published"
        ? "Producto publicado en el catálogo local de la demo."
        : record.reviewStatus === "reviewed"
          ? "Ficha revisada. Ya puede completar los datos comerciales y publicarla."
          : "La ficha ha vuelto a la cola de revisión.",
    );
    setEditingProductId(null);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Productos", catalogProducts.length, "Catálogo total"],
          ["Pendientes", counts.pending, "Por revisar"],
          ["Revisados", counts.reviewed, "Listos para completar"],
          ["Publicados", counts.published, "Catálogo validado"],
        ].map(([label, value, detail]) => (
          <Card className="p-5" key={label}>
            <p className="text-ink-muted text-xs font-bold tracking-wider uppercase">
              {label}
            </p>
            <strong className="display-title text-forest mt-2 block text-4xl">
              {value}
            </strong>
            <p className="text-ink-muted mt-1 text-xs">{detail}</p>
          </Card>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-muted max-w-2xl text-sm">
          Revisa el contenido técnico, completa los datos comerciales y publica
          únicamente las fichas validadas.
        </p>
        <Button
          onClick={() => {
            setShowForm((visible) => !visible);
            setEditingProductId(null);
          }}
        >
          {showForm ? (
            <X className="size-4" />
          ) : (
            <PackagePlus className="size-4" />
          )}
          {showForm ? "Cerrar formulario" : "Añadir producto"}
        </Button>
      </div>

      {editingProduct ? (
        <CatalogProductEditor
          product={editingProduct}
          reviewStatus={getCatalogReviewStatus(
            editingProduct,
            recordMap.get(editingProduct.id),
          )}
          onClose={() => setEditingProductId(null)}
          onSave={handleSaveReview}
        />
      ) : null}

      {showForm ? (
        <Card className="overflow-hidden">
          <div className="border-forest/10 bg-sage/45 border-b px-5 py-4 sm:px-7">
            <p className="eyebrow">Alta manual</p>
            <h2 className="text-forest mt-1 text-xl font-black">
              Nuevo producto de parafarmacia
            </h2>
          </div>
          <form
            className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7"
            onSubmit={handleCreateProduct}
          >
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">
              Nombre del producto
              <Input
                name="name"
                required
                placeholder="Ej. Gel limpiador suave"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Marca o laboratorio
              <Input name="brand" defaultValue="Amapola" required />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Categoría
              <select className={fieldClassName} name="categoryId" required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Precio con IVA (€)
              <Input min="0" name="price" step="0.01" type="number" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              IVA
              <select
                className={fieldClassName}
                defaultValue="21"
                name="taxRate"
              >
                <option value="21">21 %</option>
                <option value="10">10 %</option>
                <option value="4">4 %</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Stock inicial
              <Input min="0" name="stock" step="1" type="number" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Máximo por pedido
              <Input
                defaultValue="6"
                min="1"
                name="maximumUnits"
                step="1"
                type="number"
              />
            </label>
            <input name="status" type="hidden" value="inactive" />
            <label className="grid gap-2 text-sm font-bold">
              Tamaño o formato
              <Input name="size" placeholder="Ej. 200 ml" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              EAN
              <Input
                inputMode="numeric"
                name="ean"
                placeholder="Código de barras"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">
              URL de imagen
              <Input name="imageUrl" placeholder="/images/producto.webp" />
            </label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">
              Descripción corta
              <Input
                name="shortDescription"
                required
                placeholder="Resumen para la tarjeta"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">
              Descripción completa
              <textarea
                className={`${fieldClassName} min-h-28 py-3`}
                name="description"
                required
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Button disabled={!hydrated} type="submit">
                <PackagePlus className="size-4" /> Guardar y revisar
              </Button>
              <span className="text-ink-muted text-xs">
                Se guarda localmente en este navegador para la demo.
              </span>
            </div>
          </form>
        </Card>
      ) : null}

      {notice ? (
        <p
          className="border-forest/10 bg-sage/50 text-forest rounded-2xl border px-4 py-3 text-sm font-bold"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-forest/10 grid gap-3 border-b p-4 md:grid-cols-[1fr_15rem]">
          <label className="relative">
            <span className="sr-only">Buscar productos</span>
            <Search className="text-ink-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <Input
              className="pl-11"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, marca o EAN"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span className="sr-only">Filtrar por revisión</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              value={statusFilter}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="reviewed">Revisados</option>
              <option value="published">Publicados</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-sage/60 text-forest">
              <tr>
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Origen / categoría</th>
                <th className="px-5 py-4">Revisión</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4 text-right">Precio</th>
                <th className="px-5 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const reviewStatus = getCatalogReviewStatus(
                  product,
                  recordMap.get(product.id),
                );
                const config = reviewConfig[reviewStatus];
                const Icon = config.icon;
                const category = categories.find(
                  (item) => item.id === product.categoryId,
                );
                return (
                  <tr className="border-forest/10 border-t" key={product.id}>
                    <td className="px-5 py-4">
                      <strong className="text-forest block">
                        {product.name}
                      </strong>
                      <span className="text-ink-muted text-xs">
                        {product.brandOrLaboratory}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-forest block text-xs font-bold">
                        {category?.name ?? product.categoryId}
                      </span>
                      <span className="text-ink-muted text-[.68rem]">
                        {product.sourceDocument
                          ? `${product.sourceDocument} · pág. ${product.sourcePage}`
                          : "Alta manual"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${config.className}`}
                      >
                        <Icon className="size-4" /> {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {product.dataReviewRequired && !recordMap.has(product.id)
                        ? "—"
                        : product.stock}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {product.priceInCents > 0
                        ? formatMoney(product.priceInCents)
                        : "Por definir"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        onClick={() => {
                          setEditingProductId(product.id);
                          setShowForm(false);
                          window.scrollTo({ top: 180, behavior: "smooth" });
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <ScanSearch className="size-4" /> Revisar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-forest/10 flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
          <p className="text-ink-muted text-xs">
            Mostrando {visibleProducts.length} de {filteredProducts.length} ·
            página {currentPage} de {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              size="sm"
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              size="sm"
              variant="outline"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
