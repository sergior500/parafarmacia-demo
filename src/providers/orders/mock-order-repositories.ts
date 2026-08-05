import type { AuditEntry } from "@/domain/audit/audit";
import type { Order } from "@/domain/order/order";
import type { AuditRepository, OrderRepository } from "@/providers/ports";

export class MockOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  constructor(initialOrders: readonly Order[] = []) {
    for (const order of initialOrders) {
      this.orders.set(order.id, structuredClone(order));
    }
  }

  async list(): Promise<Order[]> {
    return Array.from(this.orders.values(), (order) => structuredClone(order));
  }

  async getById(id: string): Promise<Order | null> {
    const order = this.orders.get(id);
    return order ? structuredClone(order) : null;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, structuredClone(order));
  }
}

export class MockAuditRepository implements AuditRepository {
  private readonly entries: AuditEntry[];

  constructor(initialEntries: readonly AuditEntry[] = []) {
    this.entries = initialEntries.map((entry) => structuredClone(entry));
  }

  async listByOrderId(orderId: string): Promise<AuditEntry[]> {
    return this.entries
      .filter((entry) => entry.orderId === orderId)
      .map((entry) => structuredClone(entry));
  }

  async append(entry: AuditEntry): Promise<void> {
    this.entries.push(structuredClone(entry));
  }
}
