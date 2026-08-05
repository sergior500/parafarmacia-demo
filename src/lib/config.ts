export const pharmacyConfig = {
  name: process.env.NEXT_PUBLIC_PHARMACY_NAME || "Amapola",
  legalName: process.env.NEXT_PUBLIC_PHARMACY_LEGAL_NAME || "",
  address:
    process.env.NEXT_PUBLIC_PHARMACY_ADDRESS || "Sevilla — dirección pendiente",
  phone: process.env.NEXT_PUBLIC_PHARMACY_PHONE || "+34 000 000 000",
  email:
    process.env.NEXT_PUBLIC_PHARMACY_EMAIL || "hola@farmacia-ejemplo.invalid",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
} as const;
