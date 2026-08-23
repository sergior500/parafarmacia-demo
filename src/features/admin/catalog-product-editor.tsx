"use client";

import {
  CheckCircle2,
  Download,
  FileCheck2,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AdminCatalogProduct,
  CatalogProductUpdate,
} from "@/features/admin/admin-catalog";
import { secureAdminFetch } from "@/features/admin/secure-admin-fetch";
import { categories } from "@/mocks/products";

const fieldClassName =
  "border-forest/15 text-ink focus:border-forest focus:ring-sage min-h-12 w-full rounded-2xl border bg-white px-4 text-sm shadow-sm outline-none focus:ring-3";

type ProductReviewIntent = "pending" | "reviewed" | "published";

function isProductReviewIntent(value: string): value is ProductReviewIntent {
  return ["pending", "reviewed", "published"].includes(value);
}

function imageDownloadName(slug: string, imageUrl: string): string {
  const match = imageUrl.match(/\.(jpe?g|png|webp)(?:[?#]|$)/i);
  const extension = match?.[1]?.toLowerCase() ?? "jpg";
  return `${slug}-imagen.${extension === "jpeg" ? "jpg" : extension}`;
}

export function CatalogProductEditor({
  product,
  onClose,
  onProductChanged,
  onSave,
}: {
  product: AdminCatalogProduct;
  onClose: () => void;
  onProductChanged: (product: AdminCatalogProduct) => void;
  onSave: (record: CatalogProductUpdate) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(product.imageUrl);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen supera el máximo de 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Selecciona una imagen JPEG, PNG o WebP.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const response = await secureAdminFetch(
        `/api/admin/products/${encodeURIComponent(product.id)}/image`,
        { method: "POST", body: formData },
      );
      const body = (await response.json().catch(() => null)) as {
        product?: AdminCatalogProduct;
        error?: string;
      } | null;
      if (!response.ok || !body?.product) {
        throw new Error(body?.error || "No se pudo subir la imagen.");
      }
      setImageUrl(body.product.imageUrl);
      onProductChanged(body.product);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen.",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const submittedIntent =
      submitter instanceof HTMLButtonElement && submitter.name === "intent"
        ? submitter.value
        : "reviewed";
    const intent: ProductReviewIntent = isProductReviewIntent(submittedIntent)
      ? submittedIntent
      : "reviewed";
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
      brandOrLaboratory: String(formData.get("brand") ?? "").trim(),
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
      imageUrl: imageUrl.trim() || undefined,
      taxRate: Number(formData.get("taxRate") ?? product.taxRate),
      maximumUnitsPerOrder: Number(
        formData.get("maximumUnits") ?? product.maximumUnitsPerOrder,
      ),
    };

    if (
      intent === "published" &&
      (!(record.priceInCents && record.priceInCents > 0) ||
        record.stock === null ||
        !record.size ||
        !record.imageUrl)
    ) {
      setError(
        "Para aprobar debes completar precio, stock, tamaño/formato e imagen.",
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
          <h2 className="text-forest mt-1 text-xl font-black">
            {product.name}
          </h2>
          <p className="text-ink-muted mt-1 text-xs">
            {product.sourceDocument
              ? `${product.sourceDocument} · página ${product.sourcePage}`
              : "Producto de alta manual"}
          </p>
        </div>
        <Button
          aria-label="Cerrar revisión"
          disabled={saving || uploadingImage}
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="size-5" />
        </Button>
      </div>

      <form
        className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          Nombre
          <Input defaultValue={product.name} name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Marca o laboratorio
          <Input
            defaultValue={product.brandOrLaboratory}
            name="brand"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Categoría
          <select
            className={fieldClassName}
            defaultValue={product.categoryId}
            name="categoryId"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Tamaño o formato comercial
          <Input
            defaultValue={product.size ?? ""}
            name="size"
            placeholder={
              product.extractedSize
                ? `Extraído del PDF: ${product.extractedSize}`
                : "Ej. 50 ml"
            }
          />
          {product.extractedSize && !product.size ? (
            <span className="text-ink-muted text-xs">
              El PDF sugiere “{product.extractedSize}”; confírmalo antes de
              aprobar.
            </span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Precio con IVA (€)
          <Input
            defaultValue={
              product.priceVerified ? product.priceInCents / 100 : ""
            }
            min="0"
            name="price"
            placeholder="Pendiente"
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Stock
          <Input
            defaultValue={product.stockVerified ? product.stock : ""}
            min="0"
            name="stock"
            placeholder="Pendiente"
            step="1"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          IVA
          <select
            className={fieldClassName}
            defaultValue={String(product.taxRate)}
            name="taxRate"
          >
            <option value="21">21 %</option>
            <option value="10">10 %</option>
            <option value="4">4 %</option>
            <option value="0">0 %</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Máximo por pedido
          <Input
            defaultValue={product.maximumUnitsPerOrder}
            min="1"
            name="maximumUnits"
            step="1"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          EAN
          <Input
            defaultValue={product.ean ?? ""}
            inputMode="numeric"
            name="ean"
            placeholder="Código de barras, si procede"
          />
        </label>
        <fieldset className="grid gap-3 sm:col-span-2">
          <legend className="text-sm font-bold">Imagen principal</legend>
          <div className="border-forest/10 bg-cream grid gap-4 rounded-3xl border p-4 sm:grid-cols-[9rem_1fr] sm:items-center">
            <div className="border-forest/10 flex aspect-square items-center justify-center overflow-hidden rounded-2xl border bg-white">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- R2 images are immutable user uploads and should bypass the optimizer.
                <img
                  alt={`Imagen de ${product.name}`}
                  className="h-full w-full object-contain p-2"
                  src={imageUrl}
                />
              ) : (
                <ImagePlus className="text-forest/35 size-10" />
              )}
            </div>
            <div>
              <p className="text-forest text-sm font-black">
                {imageUrl ? "Imagen lista" : "Añade la fotografía del producto"}
              </p>
              <p className="text-ink-muted mt-1 text-xs leading-5">
                JPEG, PNG o WebP · máximo 5 MB. Usa únicamente imágenes propias
                o autorizadas por el laboratorio.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="bg-forest text-cream hover:bg-forest/90 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-black">
                  {uploadingImage ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  {uploadingImage
                    ? "Subiendo…"
                    : imageUrl
                      ? "Sustituir imagen"
                      : "Seleccionar imagen"}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploadingImage || saving}
                    onChange={(event) => void handleImageUpload(event)}
                    type="file"
                  />
                </label>
                {imageUrl ? (
                  <>
                    {imageUrl.startsWith("/") && !imageUrl.startsWith("//") ? (
                      <Button asChild size="sm" variant="outline">
                        <a
                          download={imageDownloadName(product.slug, imageUrl)}
                          href={imageUrl}
                        >
                          <Download className="size-4" /> Descargar imagen
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      disabled={uploadingImage || saving}
                      onClick={() => setImageUrl("")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Trash2 className="size-4" /> Quitar al guardar
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <details className="text-xs">
            <summary className="text-ink-muted cursor-pointer font-bold">
              Usar una URL externa en su lugar
            </summary>
            <Input
              className="mt-2"
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://…"
              value={imageUrl}
            />
          </details>
        </fieldset>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          Descripción corta
          <textarea
            className={`${fieldClassName} min-h-24 py-3`}
            defaultValue={product.shortDescription}
            name="shortDescription"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          Descripción
          <textarea
            className={`${fieldClassName} min-h-36 py-3`}
            defaultValue={product.description}
            name="description"
            required
          />
        </label>

        <details className="border-forest/10 bg-cream rounded-2xl border p-4 sm:col-span-2">
          <summary className="text-forest cursor-pointer text-sm font-black">
            Revisar contenido técnico
          </summary>
          <div className="mt-5 grid gap-5">
            <label className="grid gap-2 text-sm font-bold">
              Modo de uso
              <textarea
                className={`${fieldClassName} min-h-28 py-3`}
                defaultValue={product.usage ?? ""}
                name="usage"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Ingredientes o composición
              <textarea
                className={`${fieldClassName} min-h-36 py-3`}
                defaultValue={product.ingredients ?? ""}
                name="ingredients"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Advertencias
              <textarea
                className={`${fieldClassName} min-h-28 py-3`}
                defaultValue={product.warnings ?? ""}
                name="warnings"
              />
            </label>
          </div>
        </details>

        {error ? (
          <p
            className="text-sm font-bold text-red-700 sm:col-span-2"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          {product.reviewStatus !== "pending" ? (
            <Button
              disabled={saving || uploadingImage}
              name="intent"
              type="submit"
              value="pending"
              variant="outline"
            >
              <RotateCcw className="size-4" /> Volver a pendiente
            </Button>
          ) : null}
          <Button
            disabled={saving || uploadingImage}
            name="intent"
            type="submit"
            value="reviewed"
            variant="secondary"
          >
            <FileCheck2 className="size-4" /> Guardar como revisado
          </Button>
          <Button
            disabled={saving || uploadingImage}
            name="intent"
            type="submit"
            value="published"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Aprobar para Shopify
          </Button>
        </div>
        <p className="text-ink-muted text-xs sm:col-span-2">
          Los cambios se guardan en la base de datos con historial. Aprobar
          exige precio, stock verificado, tamaño e imagen; se enviará a Shopify
          como borrador.
        </p>
      </form>
    </Card>
  );
}
