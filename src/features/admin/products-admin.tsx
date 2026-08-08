"use client";

import {
  CheckCircle2,
  CircleOff,
  FileWarning,
  PackagePlus,
  PackageX,
  Search,
  ShieldX,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isProductPricePending,
  type Product,
  type ProductStatus,
} from "@/domain/product/product";
import { parseStoredProducts } from "@/features/demo/storage-validation";
import { formatMoney } from "@/lib/format";
import { categories, products as seededProducts } from "@/mocks/products";

const CUSTOM_PRODUCTS_KEY = "parafarmacia-demo-custom-products-v1";

const statusConfig: Record<
  ProductStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  active: {
    label: "Activo",
    icon: CheckCircle2,
    className: "text-emerald-700",
  },
  inactive: {
    label: "Inactivo",
    icon: CircleOff,
    className: "text-stone-600",
  },
  temporarily_unavailable: {
    label: "Sin disponibilidad",
    icon: PackageX,
    className: "text-amber-700",
  },
  withdrawn: {
    label: "Retirado",
    icon: ShieldX,
    className: "text-red-700",
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
  const [hydrated, setHydrated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const catalogProducts = useMemo(
    () => [...customProducts, ...seededProducts],
    [customProducts],
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- One-time hydration from demo-only browser storage. */
    setCustomProducts(
      parseStoredProducts(localStorage.getItem(CUSTOM_PRODUCTS_KEY)) ?? [],
    );
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return catalogProducts.filter((product) => {
      const matchesQuery = normalizedQuery
        ? [product.name, product.brandOrLaboratory, product.ean ?? ""].some(
            (value) => value.toLocaleLowerCase("es").includes(normalizedQuery),
          )
        : true;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending"
            ? product.dataReviewRequired
            : product.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [catalogProducts, query, statusFilter]);

  const pendingCount = catalogProducts.filter(
    (product) => product.dataReviewRequired,
  ).length;
  const availableCount = catalogProducts.filter(
    (product) => product.availableForOnlineSale && product.stock > 0,
  ).length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      availableForOnlineSale: status === "active" && stock > 0 && price > 0,
      size: String(formData.get("size") ?? "").trim() || undefined,
      badges: ["Alta manual"],
      dataReviewRequired: false,
    };

    setCustomProducts((current) => {
      const nextProducts = [product, ...current];
      localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(nextProducts));
      return nextProducts;
    });
    form.reset();
    setNotice(`${name} se ha añadido al catálogo de esta demo.`);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Productos", catalogProducts.length, "Catálogo total"],
          ["Pendientes", pendingCount, "Precio y stock por validar"],
          ["A la venta", availableCount, "Disponibles online"],
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
          Las fichas importadas desde PDF quedan bloqueadas para venta hasta
          completar sus datos comerciales.
        </p>
        <Button onClick={() => setShowForm((visible) => !visible)}>
          {showForm ? (
            <X className="size-4" />
          ) : (
            <PackagePlus className="size-4" />
          )}
          {showForm ? "Cerrar formulario" : "Añadir producto"}
        </Button>
      </div>

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
            onSubmit={handleSubmit}
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
              <Input min="0" name="price" required step="0.01" type="number" />
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
              <Input min="0" name="stock" required step="1" type="number" />
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
              Estado
              <select
                className={fieldClassName}
                defaultValue="inactive"
                name="status"
              >
                <option value="inactive">Inactivo</option>
                <option value="active">Activo</option>
                <option value="temporarily_unavailable">
                  Sin disponibilidad
                </option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Formato
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
            <label className="grid gap-2 text-sm font-bold">
              URL de imagen
              <Input
                name="imageUrl"
                placeholder="/images/producto.webp"
                type="text"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">
              Descripción corta
              <Input
                name="shortDescription"
                required
                placeholder="Resumen para la tarjeta de producto"
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
                <PackagePlus className="size-4" />
                Guardar producto
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, marca o EAN"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select
              className={fieldClassName}
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes de revisión</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="temporarily_unavailable">
                Sin disponibilidad
              </option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-sage/60 text-forest">
              <tr>
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Origen / categoría</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const config = statusConfig[product.status];
                const Icon = config.icon;
                const pending = isProductPricePending(product);
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
                      {product.dataReviewRequired ? (
                        <span className="inline-flex items-center gap-2 font-bold text-amber-700">
                          <FileWarning className="size-4" /> Pendiente
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-2 font-bold ${config.className}`}
                        >
                          <Icon aria-hidden="true" className="size-4" />{" "}
                          {config.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {pending ? "—" : product.stock}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {pending
                        ? "Por definir"
                        : formatMoney(product.priceInCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-ink-muted border-forest/10 border-t px-5 py-3 text-xs">
          Mostrando {filteredProducts.length} de {catalogProducts.length}{" "}
          productos.
        </p>
      </Card>
    </div>
  );
}
