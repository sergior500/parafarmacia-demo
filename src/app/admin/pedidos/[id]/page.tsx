import type { Metadata } from "next";

import { OrderDetail } from "@/features/admin/order-detail";
import { seededOrders } from "@/mocks/orders";

export const metadata: Metadata = {
  title: "Detalle de pedido · Panel interno",
  description: "Gestión y auditoría de un pedido ficticio.",
};

export function generateStaticParams() {
  return seededOrders.map((order) => ({ id: order.id }));
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
