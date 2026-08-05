import { CheckCircle2, CircleOff, PackageX, ShieldX } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ProductStatus } from "@/domain/product/product";
import { formatMoney } from "@/lib/format";
import { products } from "@/mocks/products";

const statusConfig: Record<
  ProductStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  active: {
    label: "Activo",
    icon: CheckCircle2,
    className: "text-emerald-700",
  },
  inactive: {
    label: "Inactivo",
    icon: CircleOff,
    className: "text-stone-600",
  },
  temporarily_unavailable: {
    label: "Sin disponibilidad",
    icon: PackageX,
    className: "text-amber-700",
  },
  withdrawn: {
    label: "Retirado",
    icon: ShieldX,
    className: "text-red-700",
  },
};

export function ProductsAdmin() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-sage/60 text-forest">
            <tr>
              <th className="px-5 py-4">Producto</th>
              <th className="px-5 py-4">Categoría</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Stock mock</th>
              <th className="px-5 py-4 text-right">Precio</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const config = statusConfig[product.status];
              const Icon = config.icon;
              return (
                <tr className="border-forest/10 border-t" key={product.id}>
                  <td className="px-5 py-4">
                    <strong className="text-forest block">
                      {product.name}
                    </strong>
                    <span className="text-ink-muted text-xs">
                      {product.brandOrLaboratory}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {product.categoryId.replace("cat-", "")}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-2 font-bold ${config.className}`}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">{product.stock}</td>
                  <td className="px-5 py-4 text-right font-bold">
                    {formatMoney(product.priceInCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
