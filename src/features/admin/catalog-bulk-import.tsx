"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImportPreviewRow {
  rowNumber: number;
  productId: string;
  name: string;
  changes: string[];
  errors: string[];
}

interface ImportPreview {
  total: number;
  changed: number;
  unchanged: number;
  invalid: number;
  rows: ImportPreviewRow[];
}

async function apiError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return new Error(body?.error || "No se pudo procesar el archivo.");
}

export function CatalogBulkImport({
  onImported,
}: {
  onImported: (productIds: string[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  function clearFile() {
    setFileName("");
    setFileText("");
    setPreview(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setPreview(null);
    if (file.size > 1024 * 1024) {
      setError("El archivo supera el límite de 1 MB.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Exporta o guarda el documento como CSV antes de importarlo.");
      return;
    }

    setReviewing(true);
    try {
      const text = await file.text();
      const response = await fetch("/api/admin/products/import/preview", {
        method: "POST",
        headers: { "content-type": "text/csv" },
        body: text,
      });
      if (!response.ok) throw await apiError(response);
      const body = (await response.json()) as { preview: ImportPreview };
      setFileName(file.name);
      setFileText(text);
      setPreview(body.preview);
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "No se pudo revisar el archivo.",
      );
    } finally {
      setReviewing(false);
    }
  }

  async function applyImport() {
    if (!fileText || !preview || preview.invalid || !preview.changed) return;
    setApplying(true);
    setError("");
    try {
      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "content-type": "text/csv" },
        body: fileText,
      });
      if (!response.ok) throw await apiError(response);
      const body = (await response.json()) as {
        updated: number;
        productIds: string[];
      };
      await onImported(body.productIds);
      clearFile();
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : "No se pudo aplicar la importación.",
      );
    } finally {
      setApplying(false);
    }
  }

  const relevantRows =
    preview?.rows.filter(
      (row) => row.errors.length > 0 || row.changes.length > 0,
    ) ?? [];

  return (
    <Card className="border-forest/15 overflow-hidden">
      <div className="border-forest/10 bg-sage/45 flex flex-wrap items-start justify-between gap-4 border-b px-5 py-5 sm:px-7">
        <div>
          <p className="eyebrow">Edición masiva</p>
          <h2 className="text-forest mt-1 text-xl font-black">
            Completar el catálogo con Excel
          </h2>
          <p className="text-ink-muted mt-1 max-w-2xl text-sm">
            Descarga el CSV, edítalo con Excel o LibreOffice y vuelve a subirlo.
            Antes de guardar verás exactamente qué productos y campos cambiarán.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link download href="/api/admin/products/export" prefetch={false}>
            <Download className="size-4" /> Descargar catálogo CSV
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[18rem_1fr] sm:p-7">
        <div className="space-y-3">
          <input
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => void handleFile(event)}
            ref={inputRef}
            type="file"
          />
          <Button
            className="w-full"
            disabled={reviewing || applying}
            onClick={() => inputRef.current?.click()}
            variant="secondary"
          >
            {reviewing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {reviewing ? "Revisando archivo…" : "Seleccionar CSV editado"}
          </Button>
          <p className="text-ink-muted text-xs leading-5">
            Máximo 500 filas y 1 MB. No cambies la columna
            <code className="mx-1 font-bold">product_id</code>; es la que evita
            duplicados y actualizaciones sobre productos equivocados.
          </p>
          {fileName ? (
            <div className="border-forest/10 flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-xs font-bold">
              <span className="min-w-0 truncate">{fileName}</span>
              <button
                aria-label="Quitar archivo"
                disabled={applying}
                onClick={clearFile}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}
        </div>

        <div>
          {!preview ? (
            <div className="border-forest/10 bg-cream flex min-h-40 items-center justify-center rounded-3xl border border-dashed p-6 text-center">
              <div>
                <FileSpreadsheet className="text-forest mx-auto size-8" />
                <p className="text-ink-muted mt-3 text-sm">
                  Aquí aparecerá la vista previa, sin modificar todavía la base
                  de datos ni Shopify.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Filas", preview.total],
                  ["Con cambios", preview.changed],
                  ["Sin cambios", preview.unchanged],
                  ["Con errores", preview.invalid],
                ].map(([label, value]) => (
                  <div className="bg-cream rounded-2xl p-3" key={label}>
                    <strong className="text-forest block text-xl">{value}</strong>
                    <span className="text-ink-muted text-xs">{label}</span>
                  </div>
                ))}
              </div>

              {relevantRows.length ? (
                <div className="max-h-64 space-y-2 overflow-auto pr-1">
                  {relevantRows.slice(0, 30).map((row) => (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-xs ${
                        row.errors.length
                          ? "border-red-200 bg-red-50 text-red-900"
                          : "border-forest/10 bg-white text-ink"
                      }`}
                      key={`${row.rowNumber}-${row.productId}`}
                    >
                      <div className="flex items-start gap-2">
                        {row.errors.length ? (
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                        )}
                        <span>
                          <strong className="block">
                            Fila {row.rowNumber} · {row.name || row.productId}
                          </strong>
                          {row.errors.length
                            ? row.errors.join(" · ")
                            : `Cambios: ${row.changes.join(", ")}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ink-muted text-sm">
                  El archivo coincide con el catálogo actual; no hay cambios que
                  aplicar.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={applying || preview.invalid > 0 || preview.changed === 0}
                  onClick={() => void applyImport()}
                >
                  {applying ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {applying
                    ? "Aplicando cambios…"
                    : `Aplicar ${preview.changed} productos`}
                </Button>
                {preview.invalid ? (
                  <span className="text-xs font-bold text-red-700">
                    Corrige las filas con errores y vuelve a subir el archivo.
                  </span>
                ) : (
                  <span className="text-ink-muted text-xs">
                    Los productos modificados quedarán listos para resincronizar.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {error ? (
        <p className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
