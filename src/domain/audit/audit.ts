import type { OrderStatus } from "@/domain/order/order";

export interface AuditEntry {
  id: string;
  orderId: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  createdAt: string;
  userId: string;
  userName: string;
  reason?: string;
  internalNote?: string;
  action: "created" | "status_changed" | "note_added";
}
