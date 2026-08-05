import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Cómo comprar",
  description: "Explicación del flujo de compra simulado de parafarmacia.",
};

export default function HowToBuyPage() {
  return (
    <InfoPage
      eyebrow="Proceso de demostración"
      intro="En esta fase no existe una compra real. El recorrido permite validar catálogo, carrito, checkout y gestión de pedidos."
      title="Cómo funciona"
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
      <h2>3. Finaliza la compra demo</h2>
      <p>
        Utiliza exclusivamente datos ficticios. El sistema crea un pedido local
        y vacía el carrito, sin realizar ningún cobro.
      </p>
      <h2>4. Gestiona el pedido</h2>
      <p>
        El panel permite preparar, enviar, entregar o cancelar el pedido, además
        de consultar ventas y rendimiento de productos.
      </p>
    </InfoPage>
  );
}
