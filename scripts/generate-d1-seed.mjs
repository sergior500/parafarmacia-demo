import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputArgument = process.argv
  .slice(2)
  .find((argument) => !argument.startsWith("--"));
const ignoreExisting = process.argv.includes("--ignore-existing");
const insertCommand = ignoreExisting ? "INSERT OR IGNORE INTO" : "INSERT INTO";

const bundle = JSON.parse(
  readFileSync(
    new URL("../database/seed/catalog_bundle.json", import.meta.url),
    "utf8",
  ),
);

function sqlValue(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insertStatements(table, columns, rows, transform = (row) => row) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += 40) {
    const values = rows
      .slice(index, index + 40)
      .map(transform)
      .map(
        (row) =>
          `(${columns.map((column) => sqlValue(row[column])).join(", ")})`,
      )
      .join(",\n");
    chunks.push(
      `${insertCommand} ${table} (${columns.join(", ")}) VALUES\n${values};`,
    );
  }
  return chunks;
}

const statements = [
  "PRAGMA foreign_keys = ON;",
  ...insertStatements(
    "catalog_sources",
    ["source_id", "file_name", "catalog_family", "description", "page_count"],
    bundle.catalog_sources,
  ),
  ...insertStatements(
    "categories",
    ["category_id", "slug", "name", "description"],
    bundle.categories,
  ),
  ...insertStatements(
    "products",
    [
      "product_id",
      "slug",
      "lifecycle_status",
      "review_status",
      "name",
      "brand",
      "category_id",
      "size_label",
      "size_extracted",
      "format_label",
      "price_cents",
      "tax_rate",
      "currency",
      "stock_quantity",
      "maximum_units_per_order",
      "available_online",
      "requires_special_transport",
      "image_path",
      "ean",
      "source_id",
      "source_page",
    ],
    bundle.products,
    (row) => ({
      ...row,
      review_status: "pending",
      image_path: null,
    }),
  ),
  ...insertStatements(
    "product_content",
    [
      "product_id",
      "short_description",
      "description",
      "usage_instructions",
      "ingredients",
      "warnings",
    ],
    bundle.product_content,
  ),
  ...insertStatements(
    "product_benefits",
    ["product_id", "position", "benefit"],
    bundle.product_benefits,
  ),
  ...insertStatements(
    "product_needs",
    ["product_id", "need_slug"],
    bundle.product_needs,
  ),
];

const header = [
  "-- Generated from database/seed/catalog_bundle.json.",
  "-- Real PDF catalogue only: 183 products; no invented prices, stock or EANs.",
  ignoreExisting
    ? "-- Completes a partially seeded catalogue without overwriting existing records."
    : "-- Regenerate with: node scripts/generate-d1-seed.mjs",
  "",
].join("\n");

const outputPath = outputArgument
  ? resolve(process.cwd(), outputArgument)
  : new URL("../drizzle/0001_seed_real_catalog.sql", import.meta.url);

writeFileSync(
  outputPath,
  `${header}${statements.join("\n--> statement-breakpoint\n")}\n`,
  "utf8",
);

console.log(
  `Seed generated: ${bundle.products.length} products, ${bundle.categories.length} categories.`,
);
