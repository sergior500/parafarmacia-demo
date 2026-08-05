import type { AuditEntry } from "@/domain/audit/audit";
import { calculateCartTotals } from "@/domain/cart/cart";
import type { Order, OrderStatus } from "@/domain/order/order";
import { products } from "@/mocks/products";

const demoCustomer = {
  firstName: "Cliente",
  lastName: "Demostración",
  email: "cliente@ejemplo.invalid",
  phone: "+34 600 000 000",
  address: "Calle Ficticia 12",
  postalCode: "41001",
  city: "Sevilla",
  province: "Sevilla",
};

const statusPaths: Record<OrderStatus, OrderStatus[]> = {
  draft: [],
  confirmed: ["confirmed"],
  preparing: ["confirmed", "preparing"],
  shipped: ["confirmed", "preparing", "shipped"],
  delivered: ["confirmed", "preparing", "shipped", "delivered"],
  cancelled: ["confirmed", "cancelled"],
  refunded: ["confirmed", "preparing", "shipped", "delivered", "refunded"],
};

function seededOrder(
  index: number,
  status: OrderStatus,
  productIndexes: number[],
  createdAt: string,
): Order {
  const id = `demo-order-${index}`;
  const lines = productIndexes.map((productIndex, lineIndex) => ({
    product: products[productIndex]!,
    quantity: lineIndex === 0 && index % 3 === 0 ? 2 : 1,
  }));
  const totals = calculateCartTotals(lines);
  const path = statusPaths[status];
  const auditTrail: AuditEntry[] = path.map((nextStatus, pathIndex) => ({
    id: `${id}-${nextStatus}-${pathIndex}`,
    orderId: id,
    previousStatus: pathIndex === 0 ? "draft" : path[pathIndex - 1]!,
    newStatus: nextStatus,
    createdAt,
    userId: pathIndex === 0 ? "demo-system" : "orders-demo",
    userName: pathIndex === 0 ? "Sistema de demostración" : "Gestión Demo",
    reason:
      nextStatus === "cancelled" || nextStatus === "refunded"
        ? "Motivo ficticio registrado para la demostración."
        : undefined,
    action: pathIndex === 0 ? "created" : "status_changed",
  }));

  return {
    id,
    reference: `DEMO-2608-${String(index).padStart(3, "0")}`,
    status,
    createdAt,
    updatedAt: createdAt,
    customer: demoCustomer,
    lines,
    ...totals,
    auditTrail,
    internalNotes:
      index === 2 ? ["Nota interna ficticia para probar la auditoría."] : [],
  };
}

export const seededOrders: Order[] = [
  seededOrder(1, "confirmed", [0, 3], "2026-08-05T08:30:00.000Z"),
  seededOrder(2, "preparing", [1], "2026-08-05T09:10:00.000Z"),
  seededOrder(3, "shipped", [2, 6], "2026-08-04T16:45:00.000Z"),
  seededOrder(4, "delivered", [0, 4], "2026-08-03T14:20:00.000Z"),
  seededOrder(5, "delivered", [1, 7], "2026-08-02T11:05:00.000Z"),
  seededOrder(6, "delivered", [0, 8], "2026-08-01T10:15:00.000Z"),
  seededOrder(7, "cancelled", [9], "2026-07-31T12:40:00.000Z"),
  seededOrder(8, "refunded", [2, 3], "2026-07-30T17:25:00.000Z"),
];
