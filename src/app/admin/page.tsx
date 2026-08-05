import type { Metadata } from "next";

import { AdminDashboard } from "@/features/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Panel interno",
  description: "Resumen comercial de ventas, pedidos y stock simulados.",
};

export default function AdminPage() {
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Vista general</p>
        <h1 className="display-title text-forest mt-2 text-5xl">
          Control del negocio
        </h1>
      </header>
      <AdminDashboard />
    </>
  );
}
