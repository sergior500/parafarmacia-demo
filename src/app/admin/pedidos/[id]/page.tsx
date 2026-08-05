import type { Metadata } from "next";

import { OrderDetail } from "@/features/admin/order-detail";

export const metadata: Metadata = {
  title: "Detalle de pedido · Panel interno",
  description: "Gestión y auditoría de un pedido ficticio.",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
