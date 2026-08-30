function publicContactValue(value: string | undefined): string {
  const normalized = value?.trim() ?? "";
  return /ejemplo\.invalid|\b0{3}[\s-]?0{3}[\s-]?0{3}\b|pendiente/i.test(
    normalized,
  )
    ? ""
    : normalized;
}

export const pharmacyConfig = {
  name: process.env.NEXT_PUBLIC_PHARMACY_NAME || "Farmacia Picual",
  legalName: process.env.NEXT_PUBLIC_PHARMACY_LEGAL_NAME || "",
  address: publicContactValue(process.env.NEXT_PUBLIC_PHARMACY_ADDRESS),
  phone: publicContactValue(process.env.NEXT_PUBLIC_PHARMACY_PHONE),
  email: publicContactValue(process.env.NEXT_PUBLIC_PHARMACY_EMAIL),
  siteUrl:
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000",
  allowIndexing:
    (process.env.ALLOW_INDEXING ?? process.env.NEXT_PUBLIC_ALLOW_INDEXING) ===
    "true",
} as const;
