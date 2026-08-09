import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Condiciones de compra" };

export default function TermsPage() {
  return (
    <InfoPage
      legal
      eyebrow="Condiciones provisionales"
      intro="La demostración no acepta pedidos ni formaliza contratos de compraventa."
      title="Condiciones de compra"
    >
      <p>
        Los métodos de pago previstos son tarjeta bancaria y Bizum. El proveedor
        de pago, la autenticación y las condiciones definitivas se configurarán
        antes del lanzamiento; esta demo nunca solicita datos bancarios ni
        realiza cargos.
      </p>
      <p>
        Precios, disponibilidad, territorio, preparación, entrega y costes de
        envío deberán validarse con la operativa real. La política de
        devoluciones excluirá, cuando legalmente corresponda, los productos de
        salud o higiene desprecintados, sin limitar los derechos y garantías
        reconocidos al consumidor.
      </p>
    </InfoPage>
  );
}
