import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="bg-forest-dark px-4 py-2 text-center text-[0.7rem] font-bold tracking-[0.08em] text-white/80 uppercase">
      <span className="inline-flex items-center gap-2.5">
        <FlaskConical
          aria-hidden="true"
          className="text-coral-light size-3.5"
        />
        <span className="sm:hidden">Demo · sin compras ni datos reales</span>
        <span className="hidden sm:inline">Entorno de demostración</span>
        <span
          aria-hidden="true"
          className="hidden size-1 rounded-full bg-white/35 sm:block"
        />
        <span className="hidden sm:inline">Sin compras ni datos reales</span>
      </span>
    </div>
  );
}
