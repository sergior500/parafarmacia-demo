import type { Metadata } from "next";

import { OrdersTable } from "@/features/admin/orders-table";

export const metadata: Metadata = {
  title: "Pedidos · Panel interno",
  description: "Consulta y filtra pedidos ficticios.",
};

export default function OrdersPage() {
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Operación simulada</p>
        <h1 className="display-title text-forest mt-2 text-5xl">Pedidos</h1>
        <p className="text-ink-muted mt-3">
          Los permisos y acciones cambian según el rol de demostración.
        </p>
      </header>
      <OrdersTable />
    </>
  );
}
