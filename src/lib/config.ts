export const pharmacyConfig = {
  name: process.env.NEXT_PUBLIC_PHARMACY_NAME || "Farmacia Picual",
  legalName: process.env.NEXT_PUBLIC_PHARMACY_LEGAL_NAME || "",
  address: process.env.NEXT_PUBLIC_PHARMACY_ADDRESS || "",
  phone: process.env.NEXT_PUBLIC_PHARMACY_PHONE || "",
  email: process.env.NEXT_PUBLIC_PHARMACY_EMAIL || "",
  siteUrl:
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000",
  allowIndexing:
    (process.env.ALLOW_INDEXING ?? process.env.NEXT_PUBLIC_ALLOW_INDEXING) ===
    "true",
} as const;
