import type {
  AdminCatalogProduct,
  CatalogReviewStatus,
} from "@/features/admin/admin-catalog";
import { categories } from "@/mocks/products";

const MAX_CSV_ROWS = 500;

export const CATALOG_CSV_HEADERS = [
  "product_id",
  "nombre",
  "marca",
  "categoria",
  "precio_eur",
  "stock",
  "formato",
  "ean",
  "iva",
  "maximo_por_pedido",
  "url_imagen",
  "estado_revision",
] as const;

export interface CatalogCsvRecord {
  productId: string;
  name: string;
  brandOrLaboratory: string;
  categoryId: string;
  priceInCents: number | null;
  stock: number | null;
  size?: string;
  ean?: string;
  taxRate: number;
  maximumUnitsPerOrder: number;
  imageUrl?: string;
  reviewStatus: CatalogReviewStatus;
}

export interface CatalogCsvRowPreview {
  rowNumber: number;
  productId: string;
  name: string;
  changes: string[];
  errors: string[];
  record?: CatalogCsvRecord;
}

export interface CatalogCsvPreview {
  total: number;
  changed: number;
  unchanged: number;
  invalid: number;
  rows: CatalogCsvRowPreview[];
}

const fieldLabels: Record<keyof CatalogCsvRecord, string> = {
  productId: "ID",
  name: "nombre",
  brandOrLaboratory: "marca",
  categoryId: "categoría",
  priceInCents: "precio",
  stock: "stock",
  size: "formato",
  ean: "EAN",
  taxRate: "IVA",
  maximumUnitsPerOrder: "máximo por pedido",
  imageUrl: "imagen",
  reviewStatus: "estado",
};

function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function reviewStatusLabel(status: CatalogReviewStatus): string {
  if (status === "published") return "aprobado";
  if (status === "reviewed") return "revisado";
  return "pendiente";
}

export function buildCatalogCsv(products: AdminCatalogProduct[]): string {
  const lines = [CATALOG_CSV_HEADERS.map(csvCell).join(";")];
  for (const product of products) {
    lines.push(
      [
        product.id,
        product.name,
        product.brandOrLaboratory,
        product.categoryId,
        product.priceVerified
          ? (product.priceInCents / 100).toFixed(2).replace(".", ",")
          : "",
        product.stockVerified ? product.stock : "",
        product.size ?? "",
        product.ean ?? "",
        product.taxRate,
        product.maximumUnitsPerOrder,
        product.imageUrl,
        reviewStatusLabel(product.reviewStatus),
      ]
        .map(csvCell)
        .join(";"),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function parseCsvRows(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && character === delimiter) {
      row.push(field);
      field = "";
      continue;
    }
    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += character;
  }
  if (quoted) throw new Error("Hay una celda entrecomillada sin cerrar.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizedHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function importedText(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  return /^'[=+\-@]/.test(trimmed) ? trimmed.slice(1) : trimmed;
}

function nullableInteger(value: string, label: string): number | null {
  if (!value) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} debe ser un número entero igual o mayor que cero.`);
  }
  return number;
}

function requiredInteger(value: string, label: string): number {
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`${label} no es válido.`);
  return number;
}

function nullablePrice(value: string): number | null {
  if (!value) return null;
  const normalized = value.includes(",")
    ? value.replaceAll(".", "").replace(",", ".")
    : value;
  const number = Number(normalized);
  const cents = Math.round(number * 100);
  if (!Number.isFinite(number) || cents < 0) {
    throw new Error("El precio no es válido.");
  }
  return cents;
}

function reviewStatus(value: string): CatalogReviewStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === "pendiente" || normalized === "pending") return "pending";
  if (normalized === "revisado" || normalized === "reviewed") return "reviewed";
  if (normalized === "aprobado" || normalized === "published") return "published";
  throw new Error("El estado debe ser pendiente, revisado o aprobado.");
}

export function parseCatalogCsv(input: string): CatalogCsvRowPreview[] {
  const text = input.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) >=
    (firstLine.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const rows = parseCsvRows(text, delimiter);
  if (rows.length < 2) throw new Error("El archivo no contiene productos.");
  if (rows.length - 1 > MAX_CSV_ROWS) {
    throw new Error(`El archivo admite un máximo de ${MAX_CSV_ROWS} productos.`);
  }

  const headers = rows[0]!.map(normalizedHeader);
  const column = new Map(headers.map((header, index) => [header, index]));
  const missingHeaders = CATALOG_CSV_HEADERS.filter(
    (header) => !column.has(header),
  );
  if (missingHeaders.length) {
    throw new Error(`Faltan columnas obligatorias: ${missingHeaders.join(", ")}.`);
  }

  return rows.slice(1).map((values, rowIndex) => {
    const value = (header: (typeof CATALOG_CSV_HEADERS)[number]) =>
      importedText(values[column.get(header)!]);
    const base = {
      rowNumber: rowIndex + 2,
      productId: value("product_id"),
      name: value("nombre"),
      changes: [],
      errors: [],
    } satisfies CatalogCsvRowPreview;
    try {
      const taxRate = requiredInteger(value("iva"), "El IVA");
      const maximumUnitsPerOrder = requiredInteger(
        value("maximo_por_pedido"),
        "El máximo por pedido",
      );
      return {
        ...base,
        record: {
          productId: base.productId,
          name: base.name,
          brandOrLaboratory: value("marca"),
          categoryId: value("categoria"),
          priceInCents: nullablePrice(value("precio_eur")),
          stock: nullableInteger(value("stock"), "El stock"),
          size: value("formato") || undefined,
          ean: value("ean") || undefined,
          taxRate,
          maximumUnitsPerOrder,
          imageUrl: value("url_imagen") || undefined,
          reviewStatus: reviewStatus(value("estado_revision")),
        },
      };
    } catch (error) {
      return {
        ...base,
        errors: [error instanceof Error ? error.message : "Fila no válida."],
      };
    }
  });
}

function normalizedOptional(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function previewCatalogCsv(
  parsedRows: CatalogCsvRowPreview[],
  products: AdminCatalogProduct[],
): CatalogCsvPreview {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const allowedCategories = new Set(categories.map(({ id }) => id));
  const seenIds = new Set<string>();

  const rows = parsedRows.map((row) => {
    const errors = [...row.errors];
    const record = row.record;
    if (!record) return { ...row, errors };
    const current = productsById.get(record.productId);
    if (!record.productId) errors.push("Falta el ID del producto.");
    if (seenIds.has(record.productId)) errors.push("El producto está duplicado en el archivo.");
    seenIds.add(record.productId);
    if (!current) errors.push("El producto no existe en el catálogo.");
    if (!record.name || record.name.length > 180) errors.push("El nombre no es válido.");
    if (!record.brandOrLaboratory || record.brandOrLaboratory.length > 140) {
      errors.push("La marca no es válida.");
    }
    if (!allowedCategories.has(record.categoryId)) errors.push("La categoría no existe.");
    if (record.taxRate < 0 || record.taxRate > 100) errors.push("El IVA no es válido.");
    if (record.maximumUnitsPerOrder < 1 || record.maximumUnitsPerOrder > 99) {
      errors.push("El máximo por pedido debe estar entre 1 y 99.");
    }
    if ((record.ean?.length ?? 0) > 32) errors.push("El EAN es demasiado largo.");
    if ((record.imageUrl?.length ?? 0) > 500) errors.push("La URL de imagen es demasiado larga.");
    if (
      record.reviewStatus === "published" &&
      (!(record.priceInCents && record.priceInCents > 0) ||
        record.stock === null ||
        !record.size ||
        !record.imageUrl)
    ) {
      errors.push("Para aprobar faltan precio, stock, formato o imagen.");
    }

    const changes: string[] = [];
    if (current && errors.length === 0) {
      const comparable: Array<[keyof CatalogCsvRecord, unknown, unknown]> = [
        ["name", current.name, record.name],
        ["brandOrLaboratory", current.brandOrLaboratory, record.brandOrLaboratory],
        ["categoryId", current.categoryId, record.categoryId],
        ["priceInCents", current.priceVerified ? current.priceInCents : null, record.priceInCents],
        ["stock", current.stockVerified ? current.stock : null, record.stock],
        ["size", normalizedOptional(current.size), normalizedOptional(record.size)],
        ["ean", normalizedOptional(current.ean), normalizedOptional(record.ean)],
        ["taxRate", current.taxRate, record.taxRate],
        ["maximumUnitsPerOrder", current.maximumUnitsPerOrder, record.maximumUnitsPerOrder],
        ["imageUrl", normalizedOptional(current.imageUrl), normalizedOptional(record.imageUrl)],
        ["reviewStatus", current.reviewStatus, record.reviewStatus],
      ];
      for (const [field, previous, next] of comparable) {
        if (previous !== next) changes.push(fieldLabels[field]);
      }
    }
    return { ...row, changes, errors };
  });

  return {
    total: rows.length,
    changed: rows.filter((row) => row.errors.length === 0 && row.changes.length > 0).length,
    unchanged: rows.filter((row) => row.errors.length === 0 && row.changes.length === 0).length,
    invalid: rows.filter((row) => row.errors.length > 0).length,
    rows,
  };
}

export function changedCatalogCsvRecords(preview: CatalogCsvPreview) {
  return preview.rows
    .filter((row) => row.errors.length === 0 && row.changes.length > 0 && row.record)
    .map((row) => ({ record: row.record!, changes: row.changes }));
}
