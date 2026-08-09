import {
  BadgeCheck,
  Headphones,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Compra segura",
    text: "Pago protegido cuando se conecte la pasarela",
  },
  {
    icon: BadgeCheck,
    title: "Productos originales",
    text: "Catálogo trazable desde proveedores autorizados",
  },
  {
    icon: Headphones,
    title: "Atención cercana",
    text: "Ayuda antes y después de tu compra",
  },
  {
    icon: Truck,
    title: "Envío a domicilio",
    text: "Plazos y tarifa pendientes del transportista",
  },
  {
    icon: RefreshCcw,
    title: "Devoluciones claras",
    text: "Excepciones de salud e higiene explicadas",
  },
] as const;

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "grid gap-3 sm:grid-cols-2"
          : "bg-forest/10 grid gap-px overflow-hidden rounded-[2rem] sm:grid-cols-2 lg:grid-cols-5"
      }
    >
      {items.map(({ icon: Icon, title, text }) => (
        <div
          className={compact ? "flex gap-3" : "bg-cream px-5 py-6"}
          key={title}
        >
          <Icon aria-hidden="true" className="text-coral size-5 shrink-0" />
          <div className={compact ? "" : "mt-4"}>
            <strong className="text-forest block text-sm">{title}</strong>
            <span className="text-ink-muted mt-1 block text-xs leading-relaxed">
              {text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
