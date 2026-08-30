import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Condiciones de compra",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <InfoPage
      legal
      eyebrow="Compra segura"
      intro="La compra se completa en el entorno seguro de Shopify. Este borrador debe completarse con las condiciones comerciales de la farmacia antes de habilitar cobros reales."
      title="Condiciones de compra"
    >
      <p>
        Los métodos de pago previstos son tarjeta bancaria y Bizum. Farmacia
        Picual no almacena datos bancarios; la autenticación y el pago se
        gestionan mediante los proveedores que la farmacia active en Shopify.
      </p>
      <p>
        Precios, disponibilidad, territorio, preparación, entrega y costes de
        envío deben coincidir con la operativa real configurada en Shopify. La
        política de devoluciones excluirá, cuando legalmente corresponda, los
        productos de salud o higiene desprecintados, sin limitar los derechos y
        garantías reconocidos al consumidor.
      </p>
    </InfoPage>
  );
}
