import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Repeat2,
  Settings,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Área de cliente de demostración.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cuenta" },
};

const accountLinks = [
  {
    icon: Package,
    title: "Mis pedidos",
    text: "Consulta estados y compras anteriores",
  },
  {
    icon: MapPin,
    title: "Direcciones",
    text: "Gestiona tus direcciones de entrega",
  },
  {
    icon: Heart,
    title: "Favoritos",
    text: "Recupera productos guardados",
    href: "/favoritos",
  },
  {
    icon: Repeat2,
    title: "Volver a comprar",
    text: "Repite productos habituales",
  },
  {
    icon: UserRound,
    title: "Datos personales",
    text: "Actualiza contacto y preferencias",
  },
  { icon: Settings, title: "Preferencias", text: "Comunicación y privacidad" },
] as const;

export default function AccountPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Mi cuenta" }]} />
      <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
        <aside>
          <Card className="bg-petrol p-7 text-white">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
              <UserRound aria-hidden="true" />
            </span>
            <p className="text-peach mt-6 text-[.65rem] font-black tracking-[.14em] uppercase">
              Cuenta de demostración
            </p>
            <h1 className="font-display mt-3 text-4xl tracking-[-.045em]">
              Hola, Cliente
            </h1>
            <p className="mt-3 text-sm text-white/65">
              La cuenta funciona como maqueta y no contiene datos personales
              reales.
            </p>
            <Button
              className="text-forest hover:bg-cream mt-7 bg-white"
              disabled
            >
              <LogOut aria-hidden="true" className="size-4" />
              Cerrar sesión
            </Button>
          </Card>
        </aside>
        <section>
          <h2 className="display-title text-forest text-4xl">
            Todo lo importante, a mano.
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {accountLinks.map(({ icon: Icon, title, text, ...item }) => {
              const content = (
                <>
                  <Icon aria-hidden="true" className="text-coral size-5" />
                  <strong className="text-forest mt-5 block">{title}</strong>
                  <span className="text-ink-muted mt-1 block text-xs">
                    {text}
                  </span>
                </>
              );
              return "href" in item ? (
                <Link
                  className="border-forest/8 rounded-[1.5rem] border bg-white p-5"
                  href={item.href}
                  key={title}
                >
                  {content}
                </Link>
              ) : (
                <div
                  className="border-forest/8 rounded-[1.5rem] border bg-white p-5 opacity-75"
                  key={title}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
