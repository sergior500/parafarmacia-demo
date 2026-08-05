import type { Order, OrderStatus, TransitionInput } from "@/domain/order/order";
import {
  addInternalNote,
  canTransition,
  transitionOrder,
} from "@/domain/order/order";
import type { StaffUser } from "@/domain/user/user";
import type { OrderManagementService } from "@/providers/ports";

const statuses: OrderStatus[] = [
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export class MockOrderManagementService implements OrderManagementService {
  async transition(order: Order, input: TransitionInput): Promise<Order> {
    return transitionOrder(order, input);
  }

  async addNote(order: Order, actor: StaffUser, note: string): Promise<Order> {
    return addInternalNote(order, actor, note);
  }

  async availableActions(
    order: Order,
    actor: StaffUser,
  ): Promise<OrderStatus[]> {
    return statuses.filter((status) => {
      if (!canTransition(order.status, status)) return false;
      if (["preparing", "shipped", "delivered", "cancelled"].includes(status)) {
        return ["owner", "order_manager"].includes(actor.role);
      }
      if (status === "refunded") {
        return ["owner", "customer_support"].includes(actor.role);
      }
      return true;
    });
  }
}

export const orderManagementService = new MockOrderManagementService();
