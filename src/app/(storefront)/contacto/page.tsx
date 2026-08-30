import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";
import { hasPublicContact, pharmacyConfig } from "@/lib/config";

export function generateMetadata(): Metadata {
  return {
    title: "Contacto",
    description: "Canales de contacto de Farmacia Picual.",
    robots: hasPublicContact ? undefined : { index: false, follow: true },
  };
}

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Atención al cliente"
      intro={
        hasPublicContact
          ? "Contacta con Farmacia Picual a través de sus canales oficiales."
          : "Esta página se activará cuando la farmacia confirme un canal oficial de atención."
      }
      title="Contacto"
    >
      <h2>Oficina de farmacia</h2>
      {hasPublicContact ? (
        <dl className="mt-5 grid gap-5">
          {pharmacyConfig.address ? (
            <div>
              <dt className="text-ink-muted text-sm">Dirección</dt>
              <dd className="text-forest font-bold">
                {pharmacyConfig.address}
              </dd>
            </div>
          ) : null}
          {pharmacyConfig.phone ? (
            <div>
              <dt className="text-ink-muted text-sm">Teléfono</dt>
              <dd className="text-forest font-bold">{pharmacyConfig.phone}</dd>
            </div>
          ) : null}
          {pharmacyConfig.email ? (
            <div>
              <dt className="text-ink-muted text-sm">Correo</dt>
              <dd className="text-forest font-bold">{pharmacyConfig.email}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="bg-sage mt-8 rounded-2xl p-5 text-sm">
          No publicamos direcciones, teléfonos ni correos sin verificar. La
          navegación ocultará este acceso hasta que exista un canal verificado.
        </p>
      )}
    </InfoPage>
  );
}
