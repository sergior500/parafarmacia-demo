import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

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
    "Prototipo de tienda online de parafarmacia con catálogo, compra y gestión comercial simulados.",
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
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: pharmacyConfig.name,
    description: "Identidad provisional. Datos pendientes de validación.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sevilla",
      addressCountry: "ES",
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
        </DemoProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
      </body>
    </html>
  );
}
