import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Cómo comprar",
  description: "Cómo comprar de forma segura en Farmacia Picual.",
};

export default function HowToBuyPage() {
  return (
    <InfoPage
      eyebrow="Compra segura"
      intro="Elige tus productos en Farmacia Picual y completa el pago en el entorno protegido de Shopify."
      title="Cómo comprar"
    >
      <h2>1. Explora el catálogo</h2>
      <p>
        Busca, filtra y revisa productos de parafarmacia. La disponibilidad y
        los límites se comprueban antes de añadirlos al carrito.
      </p>
      <h2>2. Revisa el carrito</h2>
      <p>
        Modifica cantidades, elimina productos y consulta el total con impuestos
        incluidos.
      </p>
      <h2>3. Continúa al pago seguro</h2>
      <p>
        Shopify volverá a comprobar disponibilidad, descuentos, entrega e
        importe antes de solicitar el pago.
      </p>
      <h2>4. Sigue tu pedido</h2>
      <p>
        Recibirás las comunicaciones configuradas para la confirmación,
        preparación y envío del pedido.
      </p>
    </InfoPage>
  );
}
