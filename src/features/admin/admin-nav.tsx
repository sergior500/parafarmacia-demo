import {
  Boxes,
  ClipboardList,
  Container,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import {
  type AdminActor,
  type AdminCapability,
  adminRoleLabel,
  hasAdminCapability,
} from "@/server/admin-auth";

const links = [
  {
    href: "/admin",
    label: "Resumen",
    icon: LayoutDashboard,
    capability: "dashboard:read",
  },
  {
    href: "/admin/preparacion",
    label: "Preparación",
    icon: ShieldCheck,
    capability: "readiness:write",
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    icon: ClipboardList,
    capability: "orders:read",
  },
  {
    href: "/admin/productos",
    label: "Productos",
    icon: Boxes,
    capability: "catalog:read",
  },
  {
    href: "/admin/inventario",
    label: "Inventario",
    icon: Container,
    capability: "inventory:read",
  },
  {
    href: "/admin/seguridad",
    label: "Seguridad",
    icon: Fingerprint,
    capability: "security:read",
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    icon: Settings,
    capability: "shopify:manage",
  },
] satisfies Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  capability: AdminCapability;
}>;

export function AdminNav({ actor }: { actor: AdminActor }) {
  return (
    <div className="border-forest/10 border-b bg-white">
      <div className="page-shell py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Área interna protegida</p>
            <p className="font-display text-forest text-3xl">
              Panel de gestión
            </p>
          </div>
          <div className="border-forest/15 text-forest inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-4 text-sm font-bold">
            <LockKeyhole className="size-4" />
            <span className="max-w-56 truncate">
              {actor.displayName} · {adminRoleLabel(actor.role)}
            </span>
          </div>
        </div>
        <nav aria-label="Navegación del panel" className="mt-6 overflow-x-auto">
          <ul className="flex min-w-max gap-2">
            {links
              .filter(({ capability }) => hasAdminCapability(actor, capability))
              .map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    className="border-forest/15 text-forest hover:bg-sage inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold"
                    href={href}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
