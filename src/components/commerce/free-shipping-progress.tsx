import { Truck } from "lucide-react";

import { formatMoney } from "@/lib/format";

export function FreeShippingProgress({
  totalInCents,
  thresholdInCents = 4900,
}: {
  totalInCents: number;
  thresholdInCents?: number;
}) {
  const remaining = Math.max(0, thresholdInCents - totalInCents);
  const percentage = Math.min(
    100,
    Math.round((totalInCents / thresholdInCents) * 100),
  );
  return (
    <div className="bg-sage/65 rounded-2xl p-4">
      <p className="text-forest flex items-center gap-2 text-sm font-bold">
        <Truck aria-hidden="true" className="size-4" />
        {remaining
          ? `Te faltan ${formatMoney(remaining)} para el envío gratuito`
          : "Has alcanzado el envío gratuito"}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={thresholdInCents}
        aria-valuenow={Math.min(totalInCents, thresholdInCents)}
      >
        <span
          className="bg-forest block h-full rounded-full transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-ink-muted mt-2 text-[.68rem]">
        Umbral y condiciones simulados para la demostración.
      </p>
    </div>
  );
}
