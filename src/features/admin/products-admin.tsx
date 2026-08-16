"use client";

import {
  BadgeCheck,
  CheckCircle2,
  CloudUpload,
  FileWarning,
  ListChecks,
  LoaderCircle,
  PackagePlus,
  PauseCircle,
  RefreshCcw,
  ScanSearch,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type AdminCatalogProduct,
  type CatalogProductCreate,
  type CatalogProductUpdate,
  type CatalogReviewStatus,
  chunkShopifyProductIds,
  getMissingCommercialFields,
  isShopifyBatchCandidate,
} from "@/features/admin/admin-catalog";
import { CatalogBulkImport } from "@/features/admin/catalog-bulk-import";
import { CatalogProductEditor } from "@/features/admin/catalog-product-editor";
import { formatMoney } from "@/lib/format";
import { categories } from "@/mocks/products";

const PAGE_SIZE = 25;
const SHOPIFY_REQUEST_BATCH_SIZE = 10;
const SHOPIFY_SELECTION_LIMIT = 250;

type BatchProgress = {
  completed: number;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  currentName: string;
  stopped: boolean;
};

const commercialFieldLabels = {
  price: "precio",
  stock: "stock",
  size: "formato",
  image: "imagen",
} as const;

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
    label: "Aprobado",
    icon: BadgeCheck,
    className: "bg-emerald-100 text-emerald-800",
  },
};

const fieldClassName =
  "border-forest/15 text-ink focus:border-forest focus:ring-sage min-h-12 w-full rounded-2xl border bg-white px-4 text-sm shadow-sm outline-none focus:ring-3";

async function apiError(response: Response): Promise<Error> {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return new Error(body?.error || "No se pudo completar la operación.");
}

function nullableNumber(formData: FormData, field: string): number | null {
  const value = String(formData.get(field) ?? "").trim();
  return value === "" ? null : Number(value);
}

export function ProductsAdmin() {
  const [catalogProducts, setCatalogProducts] = useState<AdminCatalogProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);
  const [syncingBatch, setSyncingBatch] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set<string>(),
  );
  const [showBatchPreview, setShowBatchPreview] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const stopBatchRef = useRef(false);

  async function loadProducts() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin/products", {
        cache: "no-store",
      });
      if (!response.ok) throw await apiError(response);
      const body = (await response.json()) as {
        products: AdminCatalogProduct[];
      };
      setCatalogProducts(body.products);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el catálogo.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial load synchronizes the client with the external D1 API.
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return catalogProducts.filter((product) => {
      const matchesQuery = normalizedQuery
        ? [product.name, product.brandOrLaboratory, product.ean ?? ""].some(
            (value) => value.toLocaleLowerCase("es").includes(normalizedQuery),
          )
        : true;
      const missingFields = getMissingCommercialFields(product);
      const matchesStatus =
        statusFilter === "all" ||
        product.reviewStatus === statusFilter ||
        (statusFilter === "incomplete" && missingFields.length > 0) ||
        (statusFilter === "commercially_ready" && missingFields.length === 0) ||
        (statusFilter === "shopify_pending" &&
          product.shopifySyncStatus === "not_synced") ||
        (statusFilter === "shopify_error" &&
          product.shopifySyncStatus === "error") ||
        (statusFilter === "shopify_synced" &&
          product.shopifySyncStatus === "synced");
      return matchesQuery && matchesStatus;
    });
  }, [catalogProducts, query, statusFilter]);

  const counts = useMemo(() => {
    const result: Record<CatalogReviewStatus, number> = {
      pending: 0,
      reviewed: 0,
      published: 0,
    };
    for (const product of catalogProducts) result[product.reviewStatus] += 1;
    return result;
  }, [catalogProducts]);

  const commercialCounts = useMemo(() => {
    const incomplete = catalogProducts.filter(
      (product) => getMissingCommercialFields(product).length > 0,
    ).length;
    return {
      incomplete,
      ready: catalogProducts.length - incomplete,
    };
  }, [catalogProducts]);

  const batchCandidateCount = useMemo(
    () => catalogProducts.filter(isShopifyBatchCandidate).length,
    [catalogProducts],
  );

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const selectedProducts = catalogProducts.filter((product) =>
    selectedProductIds.has(product.id),
  );
  const selectedIncompleteCount = selectedProducts.filter(
    (product) => getMissingCommercialFields(product).length > 0,
  ).length;
  const selectableVisibleProducts = visibleProducts.filter(
    isShopifyBatchCandidate,
  );
  const allSelectableVisibleSelected =
    selectableVisibleProducts.length > 0 &&
    selectableVisibleProducts.every((product) =>
      selectedProductIds.has(product.id),
    );
  const editingProduct = editingProductId
    ? catalogProducts.find((product) => product.id === editingProductId)
    : undefined;

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const price = nullableNumber(formData, "price");
    const payload: CatalogProductCreate = {
      name: String(formData.get("name") ?? "").trim(),
      brandOrLaboratory: String(formData.get("brand") ?? "").trim(),
      categoryId: String(formData.get("categoryId") ?? ""),
      priceInCents: price === null ? null : Math.round(price * 100),
      stock: nullableNumber(formData, "stock"),
      taxRate: Number(formData.get("taxRate") ?? 21),
      maximumUnitsPerOrder: Number(formData.get("maximumUnits") ?? 6),
      size: String(formData.get("size") ?? "").trim() || undefined,
      ean: String(formData.get("ean") ?? "").trim() || undefined,
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
      shortDescription: String(formData.get("shortDescription") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
    };

    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw await apiError(response);
      const body = (await response.json()) as { product: AdminCatalogProduct };
      setCatalogProducts((current) => [body.product, ...current]);
      form.reset();
      setNotice(
        `${body.product.name} se ha guardado en la base de datos y queda pendiente de revisión.`,
      );
      setShowForm(false);
      setEditingProductId(body.product.id);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo crear el producto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReview(input: CatalogProductUpdate) {
    if (!editingProductId) return;
    const response = await fetch(
      `/api/admin/products/${encodeURIComponent(editingProductId)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    if (!response.ok) throw await apiError(response);
    const body = (await response.json()) as { product: AdminCatalogProduct };
    setCatalogProducts((current) =>
      current.map((product) =>
        product.id === body.product.id ? body.product : product,
      ),
    );
    setNotice(
      body.product.reviewStatus === "published"
        ? "Ficha aprobada y lista para una futura sincronización con Shopify."
        : body.product.reviewStatus === "reviewed"
          ? "Ficha revisada y guardada en la base de datos."
          : "La ficha ha vuelto a la cola de revisión.",
    );
    setEditingProductId(null);
  }

  async function handleShopifySync(productId: string) {
    setSyncingProductId(productId);
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}/sync`,
        { method: "POST" },
      );
      if (!response.ok) throw await apiError(response);
      const body = (await response.json()) as { product: AdminCatalogProduct };
      setCatalogProducts((current) =>
        current.map((product) =>
          product.id === body.product.id ? body.product : product,
        ),
      );
      setNotice(
        `${body.product.name} se ha sincronizado con Shopify como borrador${getMissingCommercialFields(body.product).length ? " pendiente de completar" : ""}.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar el producto.",
      );
      await loadProducts();
    } finally {
      setSyncingProductId(null);
    }
  }

  async function handleCatalogImported(productIds: string[]) {
    await loadProducts();
    setSelectedProductIds(
      new Set(productIds.slice(0, SHOPIFY_SELECTION_LIMIT)),
    );
    setBatchProgress(null);
    setShowBatchPreview(productIds.length > 0);
    setNotice(
      `${productIds.length} productos actualizados en la base de datos y preparados para resincronizar como borradores.`,
    );
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
        return next;
      }
      if (next.size >= SHOPIFY_SELECTION_LIMIT) {
        setNotice(
          `La cola admite un máximo de ${SHOPIFY_SELECTION_LIMIT} productos.`,
        );
        return current;
      }
      next.add(productId);
      return next;
    });
    setBatchProgress(null);
  }

  function toggleVisibleSelection() {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (allSelectableVisibleSelected) {
        for (const product of selectableVisibleProducts) next.delete(product.id);
        return next;
      }
      for (const product of selectableVisibleProducts) {
        if (next.size >= SHOPIFY_SELECTION_LIMIT) break;
        next.add(product.id);
      }
      if (
        selectableVisibleProducts.some((product) => !next.has(product.id))
      ) {
        setNotice(
          `Se han seleccionado los primeros ${SHOPIFY_SELECTION_LIMIT} productos disponibles.`,
        );
      }
      return next;
    });
    setBatchProgress(null);
  }

  function selectAllShopifyCandidates() {
    const candidateIds = catalogProducts
      .filter(isShopifyBatchCandidate)
      .slice(0, SHOPIFY_SELECTION_LIMIT)
      .map(({ id }) => id);
    setSelectedProductIds(new Set(candidateIds));
    setBatchProgress(null);
    setShowBatchPreview(candidateIds.length > 0);
    setNotice(
      candidateIds.length
        ? `${candidateIds.length} productos preparados. Revisa el resumen antes de enviarlos como borradores.`
        : "No quedan productos pendientes de sincronizar.",
    );
  }

  async function handleShopifyBatchSync() {
    const queue = selectedProducts.slice(0, SHOPIFY_SELECTION_LIMIT);
    if (queue.length === 0) return;
    const batches = chunkShopifyProductIds(
      queue.map(({ id }) => id),
      SHOPIFY_REQUEST_BATCH_SIZE,
    );
    const productsById = new Map(queue.map((product) => [product.id, product]));

    setSyncingBatch(true);
    setShowBatchPreview(true);
    setNotice("");
    stopBatchRef.current = false;
    const remainingSelection = new Set(queue.map(({ id }) => id));
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    let completed = 0;
    setBatchProgress({
      completed,
      total: queue.length,
      succeeded,
      failed,
      skipped,
      currentName: queue[0]?.name ?? "",
      stopped: false,
    });

    try {
      for (const [batchIndex, productIds] of batches.entries()) {
        if (stopBatchRef.current) break;
        const firstProduct = productIds[0]
          ? productsById.get(productIds[0])
          : undefined;
        setBatchProgress({
          completed,
          total: queue.length,
          succeeded,
          failed,
          skipped,
          currentName:
            batches.length > 1
              ? `lote ${batchIndex + 1} de ${batches.length}`
              : firstProduct?.name ?? "borradores seleccionados",
          stopped: false,
        });

        const response = await fetch("/api/admin/products/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ productIds }),
        });
        if (!response.ok) throw await apiError(response);
        const body = (await response.json()) as {
          succeeded: number;
          failed: number;
          skipped: number;
          skippedIds: string[];
          results: Array<{
            productId: string;
            status: "synced" | "error";
          }>;
        };
        succeeded += body.succeeded;
        failed += body.failed;
        skipped += body.skipped;
        completed += productIds.length;
        for (const result of body.results) {
          if (result.status === "synced") {
            remainingSelection.delete(result.productId);
          }
        }
        for (const skippedId of body.skippedIds) {
          remainingSelection.delete(skippedId);
        }
        setBatchProgress({
          completed,
          total: queue.length,
          succeeded,
          failed,
          skipped,
          currentName:
            batches.length > 1
              ? `lote ${batchIndex + 1} de ${batches.length}`
              : firstProduct?.name ?? "borradores seleccionados",
          stopped: false,
        });
      }

      const stopped = stopBatchRef.current;
      setBatchProgress({
        completed,
        total: queue.length,
        succeeded,
        failed,
        skipped,
        currentName: "",
        stopped,
      });
      setNotice(
        stopped
          ? `Lote detenido: ${succeeded} sincronizados y ${failed} con error. La selección restante se conserva.`
          : `Lote terminado: ${succeeded} sincronizados, ${failed} con error y ${skipped} omitidos.${failed ? " Los errores siguen seleccionados para reintentarlos." : ""}`,
      );
      await loadProducts();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar el lote.",
      );
      setBatchProgress((current) =>
        current ? { ...current, currentName: "", stopped: true } : current,
      );
    } finally {
      setSelectedProductIds(remainingSelection);
      setSyncingBatch(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Productos reales", catalogProducts.length, "Importados de los PDF"],
          [
            "Datos pendientes",
            commercialCounts.incomplete,
            "La farmacia puede completarlos después",
          ],
          [
            "Datos completos",
            commercialCounts.ready,
            `${counts.reviewed} fichas revisadas`,
          ],
          [
            "Aprobados",
            counts.published,
            `${catalogProducts.filter((product) => product.shopifySyncStatus === "synced").length} sincronizados`,
          ],
        ].map(([label, value, detail]) => (
          <Card className="p-5" key={label}>
            <p className="text-ink-muted text-xs font-bold tracking-wider uppercase">
              {label}
            </p>
            <strong className="display-title text-forest mt-2 block text-4xl">
              {loading ? "—" : value}
            </strong>
            <p className="text-ink-muted mt-1 text-xs">{detail}</p>
          </Card>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-muted max-w-2xl text-sm">
          Las 183 referencias de los PDF son el catálogo real. Precio, formato,
          stock e imagen pueden quedar pendientes hasta que la farmacia los
          complete. Las fichas incompletas pueden enviarse a Shopify únicamente
          como borradores protegidos.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={batchCandidateCount === 0 || syncingBatch}
            onClick={selectAllShopifyCandidates}
            variant="outline"
          >
            <CloudUpload className="size-4" />
            Preparar pendientes ({batchCandidateCount})
          </Button>
          <Button
            disabled={selectedProductIds.size === 0 || syncingBatch}
            onClick={() => setShowBatchPreview(true)}
            variant="secondary"
          >
            <ListChecks className="size-4" />
            Revisar lote ({selectedProductIds.size})
          </Button>
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
      </div>

      {batchCandidateCount > 0 ? (
        <p className="border-forest/10 bg-cream text-ink-muted rounded-2xl border px-4 py-3 text-xs">
          Hay <strong className="text-forest">{batchCandidateCount}</strong>{" "}
          productos pendientes o con error. Puedes preparar todo el catálogo;
          el panel lo dividirá en lotes técnicos de diez y todos se crearán como
          borradores, sin publicarse automáticamente.
        </p>
      ) : null}

      <CatalogBulkImport onImported={handleCatalogImported} />

      {showBatchPreview && (selectedProducts.length > 0 || batchProgress) ? (
        <Card className="border-forest/15 overflow-hidden">
          <div className="border-forest/10 bg-sage/45 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-7">
            <div>
              <p className="eyebrow">Vista previa del lote</p>
              <h2 className="text-forest mt-1 text-xl font-black">
                {selectedProducts.length} productos preparados
              </h2>
            </div>
            {!syncingBatch ? (
              <Button
                aria-label="Cerrar vista previa"
                onClick={() => setShowBatchPreview(false)}
                size="sm"
                variant="ghost"
              >
                <X className="size-4" /> Cerrar
              </Button>
            ) : null}
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_18rem] sm:p-7">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                  {selectedIncompleteCount} con datos pendientes
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">
                  {selectedProducts.length - selectedIncompleteCount} completos
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-700">
                  {selectedProducts.filter((product) => product.shopifySyncStatus === "error").length}{" "}
                  reintentos
                </span>
              </div>
              {selectedProducts.length ? (
                <ol className="grid gap-2 text-sm sm:grid-cols-2">
                  {selectedProducts.slice(0, 20).map((product, index) => (
                    <li
                      className="border-forest/10 flex gap-3 rounded-2xl border bg-white px-4 py-3"
                      key={product.id}
                    >
                      <span className="text-forest font-black">{index + 1}.</span>
                      <span>
                        <strong className="text-forest block">{product.name}</strong>
                        <span className="text-ink-muted text-xs">
                          {getMissingCommercialFields(product).length
                            ? "Borrador pendiente de completar"
                            : "Datos comerciales completos"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
              {selectedProducts.length > 20 ? (
                <p className="text-ink-muted text-xs font-bold">
                  Y {selectedProducts.length - 20} productos más incluidos en
                  la cola.
                </p>
              ) : null}
              {batchProgress ? (
                <div className="border-forest/10 rounded-2xl border bg-white p-4" aria-live="polite">
                  <div className="flex items-center justify-between gap-3 text-sm font-bold">
                    <span>
                      {syncingBatch
                        ? `Procesando ${batchProgress.currentName}`
                        : batchProgress.stopped
                          ? "Proceso detenido"
                          : "Proceso terminado"}
                    </span>
                    <span>
                      {batchProgress.completed}/{batchProgress.total}
                    </span>
                  </div>
                  <div className="bg-stone-100 mt-3 h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-forest h-full rounded-full transition-all"
                      style={{
                        width: `${batchProgress.total ? (batchProgress.completed / batchProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-ink-muted mt-3 text-xs">
                    {batchProgress.succeeded} sincronizados · {batchProgress.failed}{" "}
                    con error · {batchProgress.skipped} omitidos
                  </p>
                </div>
              ) : null}
            </div>
            <aside className="bg-cream border-forest/10 rounded-3xl border p-5">
              <ShieldCheck className="text-forest size-7" />
              <h3 className="text-forest mt-3 font-black">Envío protegido</h3>
              <p className="text-ink-muted mt-2 text-sm leading-6">
                Shopify recibirá borradores. Los precios desconocidos serán 0 €, el
                inventario no se publicará y las fichas incompletas quedarán
                etiquetadas como pendientes. La cola se procesa en grupos de diez
                y puede detenerse entre grupos.
              </p>
              <div className="mt-5 grid gap-2">
                {syncingBatch ? (
                  <Button
                    onClick={() => {
                      stopBatchRef.current = true;
                      setNotice("El lote se detendrá al terminar el producto actual.");
                    }}
                    variant="outline"
                  >
                    <PauseCircle className="size-4" /> Detener después del actual
                  </Button>
                ) : selectedProducts.length ? (
                  <Button onClick={() => void handleShopifyBatchSync()}>
                    {selectedProducts.some(
                      (product) => product.shopifySyncStatus === "error",
                    ) ? (
                      <RefreshCcw className="size-4" />
                    ) : (
                      <CloudUpload className="size-4" />
                    )}
                    Sincronizar {selectedProducts.length} como borrador
                  </Button>
                ) : null}
                {!syncingBatch && selectedProducts.length ? (
                  <Button
                    onClick={() => {
                      setSelectedProductIds(new Set<string>());
                      setBatchProgress(null);
                    }}
                    variant="ghost"
                  >
                    Limpiar selección
                  </Button>
                ) : null}
              </div>
            </aside>
          </div>
        </Card>
      ) : null}

      {editingProduct ? (
        <CatalogProductEditor
          product={editingProduct}
          onClose={() => setEditingProductId(null)}
          onProductChanged={(updatedProduct) => {
            setCatalogProducts((current) =>
              current.map((product) =>
                product.id === updatedProduct.id ? updatedProduct : product,
              ),
            );
            setNotice("Imagen guardada y producto preparado para resincronizar.");
          }}
          onSave={handleSaveReview}
        />
      ) : null}

      {showForm ? (
        <Card className="overflow-hidden">
          <div className="border-forest/10 bg-sage/45 border-b px-5 py-4 sm:px-7">
            <p className="eyebrow">Alta en base de datos</p>
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
              <Input name="brand" defaultValue="Marca por confirmar" required />
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
              <Input
                min="0"
                name="price"
                step="0.01"
                type="number"
                placeholder="Pendiente"
              />
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
              <Input
                min="0"
                name="stock"
                step="1"
                type="number"
                placeholder="Pendiente"
              />
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
              <Button disabled={saving} type="submit">
                {saving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <PackagePlus className="size-4" />
                )}
                {saving ? "Guardando…" : "Guardar en catálogo"}
              </Button>
              <span className="text-ink-muted text-xs">
                Se guardará como pendiente y quedará registrado en el historial.
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

      {loadError ? (
        <Card className="border-red-200 bg-red-50 p-5">
          <p className="font-bold text-red-800" role="alert">
            {loadError}
          </p>
          <Button
            className="mt-3"
            onClick={() => void loadProducts()}
            size="sm"
            variant="outline"
          >
            Reintentar
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-forest/10 grid gap-3 border-b p-4 md:grid-cols-[1fr_17rem]">
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
              <option value="incomplete">Con datos pendientes</option>
              <option value="commercially_ready">
                Datos comerciales completos
              </option>
              <option value="pending">Pendientes</option>
              <option value="reviewed">Revisados</option>
              <option value="published">Aprobados</option>
              <option value="shopify_pending">Shopify · sin enviar</option>
              <option value="shopify_error">Shopify · con error</option>
              <option value="shopify_synced">Shopify · sincronizados</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1140px] text-left text-sm">
            <thead className="bg-sage/60 text-forest">
              <tr>
                <th className="px-5 py-4">
                  <input
                    aria-label="Seleccionar productos visibles para el lote"
                    checked={allSelectableVisibleSelected}
                    className="accent-forest size-4 rounded"
                    disabled={
                      selectableVisibleProducts.length === 0 || syncingBatch
                    }
                    onChange={toggleVisibleSelection}
                    title="Seleccionar los productos pendientes de esta página"
                    type="checkbox"
                  />
                </th>
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Origen / categoría</th>
                <th className="px-5 py-4">Revisión</th>
                <th className="px-5 py-4">Shopify</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4 text-right">Precio</th>
                <th className="px-5 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="text-ink-muted px-5 py-10 text-center"
                    colSpan={8}
                  >
                    <LoaderCircle className="mr-2 inline size-5 animate-spin" />
                    Cargando catálogo persistente…
                  </td>
                </tr>
              ) : null}
              {!loading && visibleProducts.length === 0 ? (
                <tr>
                  <td
                    className="text-ink-muted px-5 py-10 text-center"
                    colSpan={8}
                  >
                    No hay productos que coincidan con el filtro.
                  </td>
                </tr>
              ) : null}
              {visibleProducts.map((product) => {
                const config = reviewConfig[product.reviewStatus];
                const Icon = config.icon;
                const category = categories.find(
                  (item) => item.id === product.categoryId,
                );
                const missingFields = getMissingCommercialFields(product);
                return (
                  <tr
                    className={`border-forest/10 border-t ${selectedProductIds.has(product.id) ? "bg-sage/25" : ""}`}
                    key={product.id}
                  >
                    <td className="px-5 py-4">
                      <input
                        aria-label={`Seleccionar ${product.name}`}
                        checked={selectedProductIds.has(product.id)}
                        className="accent-forest size-4 rounded"
                        disabled={
                          !isShopifyBatchCandidate(product) || syncingBatch
                        }
                        onChange={() => toggleProductSelection(product.id)}
                        title={
                          product.shopifySyncStatus === "synced"
                            ? "Este producto ya está sincronizado"
                            : "Añadir al lote de borradores"
                        }
                        type="checkbox"
                      />
                    </td>
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
                      <span
                        className={`mt-2 block text-[.68rem] font-bold ${missingFields.length ? "text-amber-700" : "text-emerald-700"}`}
                      >
                        {missingFields.length
                          ? `Faltan: ${missingFields.map((field) => commercialFieldLabels[field]).join(", ")}`
                          : "Datos comerciales completos"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${product.shopifySyncStatus === "synced" ? "bg-emerald-100 text-emerald-800" : product.shopifySyncStatus === "error" ? "bg-red-100 text-red-800" : product.shopifySyncStatus === "syncing" ? "bg-sky-100 text-sky-800" : "bg-stone-100 text-stone-700"}`}
                        title={product.shopifySyncError}
                      >
                        {product.shopifySyncStatus === "synced"
                          ? "Sincronizado"
                          : product.shopifySyncStatus === "error"
                            ? "Con error"
                            : product.shopifySyncStatus === "syncing"
                              ? "Enviando"
                              : "Sin enviar"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {product.stockVerified ? product.stock : "—"}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {product.priceVerified
                        ? formatMoney(product.priceInCents)
                        : "Por definir"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          disabled={
                            syncingProductId === product.id || syncingBatch
                          }
                          onClick={() => void handleShopifySync(product.id)}
                          size="sm"
                          variant="secondary"
                          title={
                            missingFields.length
                              ? "Se creará como borrador pendiente; nunca se publicará automáticamente"
                              : "Se creará como borrador en Shopify"
                          }
                        >
                          {syncingProductId === product.id ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <CloudUpload className="size-4" />
                          )}
                          {product.shopifySyncStatus === "synced"
                            ? "Actualizar"
                            : missingFields.length
                              ? "Crear borrador"
                              : "Enviar"}
                        </Button>
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
                      </div>
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
