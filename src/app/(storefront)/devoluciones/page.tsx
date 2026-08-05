import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Devoluciones" };

export default function ReturnsPage() {
  return (
    <InfoPage
      legal
      eyebrow="Placeholder legal"
      intro="No se ha definido ni validado una política de devoluciones."
      title="Devoluciones"
    >
      <p>
        Las condiciones aplicables a cada categoría de parafarmacia deberán ser
        redactadas por especialistas y reflejar la operativa real de la tienda.
      </p>
    </InfoPage>
  );
}
