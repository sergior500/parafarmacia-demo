import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CookiePreferences } from "@/components/layout/cookie-preferences";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DemoProvider } from "@/features/demo/demo-provider";
import { pharmacyConfig } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(pharmacyConfig.siteUrl),
  title: {
    default: `${pharmacyConfig.name} · Demostración`,
    template: `%s · ${pharmacyConfig.name}`,
  },
  description:
    "Parafarmacia online de demostración: dermocosmética, protección solar, higiene y cuidado infantil.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: `${pharmacyConfig.name} · Demostración`,
    description:
      "Catálogo de parafarmacia y flujo de compra completamente simulados.",
    siteName: pharmacyConfig.name,
    images: [
      {
        url: `${pharmacyConfig.siteUrl}/og.png`,
        width: 1736,
        height: 908,
        alt: `${pharmacyConfig.name} — catálogo de parafarmacia de demostración`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pharmacyConfig.name} · Demostración`,
    description:
      "Catálogo de parafarmacia y flujo de compra completamente simulados.",
    images: [`${pharmacyConfig.siteUrl}/og.png`],
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
        <DemoProvider>
          <DemoBanner />
          <SiteHeader />
          <main id="contenido">{children}</main>
          <SiteFooter />
          <CookiePreferences />
        </DemoProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
        />
      </body>
    </html>
  );
}
