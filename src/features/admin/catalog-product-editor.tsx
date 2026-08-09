"use client";

import {
  CheckCircle2,
  FileCheck2,
  LoaderCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AdminCatalogProduct,
  CatalogProductUpdate,
} from "@/features/admin/admin-catalog";
import { categories } from "@/mocks/products";

const fieldClassName =
  "border-forest/15 text-ink focus:border-forest focus:ring-sage min-h-12 w-full rounded-2xl border bg-white px-4 text-sm shadow-sm outline-none focus:ring-3";

export function CatalogProductEditor({
  product,
  onClose,
  onSave,
}: {
  product: AdminCatalogProduct;
  onClose: () => void;
  onSave: (record: CatalogProductUpdate) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const intent = String(formData.get("intent") ?? "reviewed") as
      | "pending"
      | "reviewed"
      | "published";
    const priceValue = String(formData.get("price") ?? "").trim();
    const stockValue = String(formData.get("stock") ?? "").trim();
    const priceInCents = priceValue
      ? Math.round(Number(priceValue) * 100)
      : null;
    const stock = stockValue ? Number(stockValue) : null;

    if (
      (priceInCents !== null &&
        (!Number.isInteger(priceInCents) || priceInCents < 0)) ||
      (stock !== null && (!Number.isInteger(stock) || stock < 0))
    ) {
      setError("Revisa el precio y el stock antes de guardar.");
      return;
    }

    const record: CatalogProductUpdate = {
      reviewStatus: intent,
      name: String(formData.get("name") ?? "").trim(),
      shortDescription: String(formData.get("shortDescription") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      usage: String(formData.get("usage") ?? "").trim() || undefined,
      ingredients:
        String(formData.get("ingredients") ?? "").trim() || undefined,
      warnings: String(formData.get("warnings") ?? "").trim() || undefined,
      categoryId: String(formData.get("categoryId") ?? product.categoryId),
      priceInCents,
      stock,
      size: String(formData.get("size") ?? "").trim() || undefined,
      ean: String(formData.get("ean") ?? "").trim() || undefined,
    };

    if (
      intent === "published" &&
      (!(record.priceInCents && record.priceInCents > 0) || !record.size)
    ) {
      setError(
        "Para aprobar debes completar al menos el precio y el tamaño/formato.",
      );
      return;
    }
    if (!record.name || !record.shortDescription || !record.description) {
      setError("Nombre y descripciones son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      await onSave(record);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la ficha.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-forest/15 overflow-hidden shadow-[0_28px_80px_-35px_rgba(18,63,56,.5)]">
      <div className="border-forest/10 bg-sage/55 flex flex-wrap items-start justify-between gap-4 border-b px-5 py-5 sm:px-7">
        <div>
          <p className="eyebrow">Revisión de ficha</p>
          <h2 className="text-forest mt-1 text-xl font-black">{product.name}</h2>
          <p className="text-ink-muted mt-1 text-xs">
            {product.sourceDocument
              ? `${product.sourceDocument} · página ${product.sourcePage}`
              : "Producto de alta manual"}
          </p>
        </div>
        <Button aria-label="Cerrar revisión" disabled={saving} onClick={onClose} size="icon" variant="ghost">
          <X className="size-5" />
        </Button>
      </div>

      <form className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          Nombre
          <Input defaultValue={product.name} name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Categoría
          <select className={fieldClassName} defaultValue={product.categoryId} name="categoryId">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Tamaño o formato comercial
          <Input defaultValue={product.size ?? ""} name="size" placeholder={product.extractedSize ? `Extraído del PDF: ${product.extractedSize}` : "Ej. 50 ml"} />
          {product.extractedSize && !product.size ? (
            <span className="text-ink-muted text-xs">El PDF sugiere “{product.extractedSize}”; confírmalo antes de aprobar.</span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Precio con IVA (€)
          <Input defaultValue={product.priceVerified ? product.priceInCents / 100 : ""} min="0" name="price" placeholder="Pendiente" step="0.01" type="number" />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Stock
          <Input defaultValue={product.stockVerified ? product.stock : ""} min="0" name="stock" placeholder="Pendiente" step="1" type="number" />
        </label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          EAN
          <Input defaultValue={product.ean ?? ""} inputMode="numeric" name="ean" placeholder="Código de barras, si procede" />
        </label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          Descripción corta
          <textarea className={`${fieldClassName} min-h-24 py-3`} defaultValue={product.shortDescription} name="shortDescription" required />
        </label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          Descripción
          <textarea className={`${fieldClassName} min-h-36 py-3`} defaultValue={product.description} name="description" required />
        </label>

        <details className="border-forest/10 bg-cream rounded-2xl border p-4 sm:col-span-2">
          <summary className="text-forest cursor-pointer text-sm font-black">Revisar contenido técnico</summary>
          <div className="mt-5 grid gap-5">
            <label className="grid gap-2 text-sm font-bold">Modo de uso<textarea className={`${fieldClassName} min-h-28 py-3`} defaultValue={product.usage ?? ""} name="usage" /></label>
            <label className="grid gap-2 text-sm font-bold">Ingredientes o composición<textarea className={`${fieldClassName} min-h-36 py-3`} defaultValue={product.ingredients ?? ""} name="ingredients" /></label>
            <label className="grid gap-2 text-sm font-bold">Advertencias<textarea className={`${fieldClassName} min-h-28 py-3`} defaultValue={product.warnings ?? ""} name="warnings" /></label>
          </div>
        </details>

        {error ? <p className="text-sm font-bold text-red-700 sm:col-span-2" role="alert">{error}</p> : null}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          {product.reviewStatus !== "pending" ? (
            <Button disabled={saving} name="intent" type="submit" value="pending" variant="outline"><RotateCcw className="size-4" /> Volver a pendiente</Button>
          ) : null}
          <Button disabled={saving} name="intent" type="submit" value="reviewed" variant="secondary"><FileCheck2 className="size-4" /> Guardar como revisado</Button>
          <Button disabled={saving} name="intent" type="submit" value="published">
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Aprobar para Shopify
          </Button>
        </div>
        <p className="text-ink-muted text-xs sm:col-span-2">
          Los cambios se guardan en la base de datos con historial. Aprobar exige precio y tamaño; la publicación comercial se hará al conectar Shopify.
        </p>
      </form>
    </Card>
  );
}
