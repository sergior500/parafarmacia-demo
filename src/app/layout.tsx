import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StorefrontProvider } from "@/features/storefront/storefront-provider";
import { pharmacyConfig } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(pharmacyConfig.siteUrl),
  title: {
    default: `${pharmacyConfig.name} · Parafarmacia online`,
    template: `%s · ${pharmacyConfig.name}`,
  },
  description:
    "Parafarmacia online especializada en dermocosmética, protección solar, higiene, cuidado infantil y bienestar.",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: `${pharmacyConfig.name} · Parafarmacia online`,
    description:
      "Dermocosmética, protección solar, higiene y bienestar en una tienda clara y cercana.",
    siteName: pharmacyConfig.name,
    images: [
      {
        url: `${pharmacyConfig.siteUrl}/og-picual.png`,
        width: 1736,
        height: 908,
        alt: `${pharmacyConfig.name} — parafarmacia online`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pharmacyConfig.name} · Parafarmacia online`,
    description:
      "Dermocosmética, protección solar, higiene y bienestar en una tienda clara y cercana.",
    images: [`${pharmacyConfig.siteUrl}/og-picual.png`],
  },
  robots: pharmacyConfig.allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: pharmacyConfig.name,
    url: pharmacyConfig.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${pharmacyConfig.siteUrl}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="es">
      <body suppressHydrationWarning>
        <StorefrontProvider>
          <SiteHeader />
          <main id="contenido">{children}</main>
          <SiteFooter />
        </StorefrontProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
        />
      </body>
    </html>
  );
}
