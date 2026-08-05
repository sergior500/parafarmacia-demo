import type { CartLine } from "@/domain/cart/cart";
import type { Customer } from "@/domain/customer/customer";
import type { Order } from "@/domain/order/order";
import { createConfirmedOrder } from "@/domain/order/order";
import type { CommerceProvider } from "@/providers/ports";

export class MockCommerceProvider implements CommerceProvider {
  async submitOrderRequest(
    customer: Customer,
    lines: CartLine[],
  ): Promise<Order> {
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    return createConfirmedOrder({
      id: crypto.randomUUID(),
      reference: `DEMO-${suffix}`,
      customer,
      lines,
    });
  }
}

export const commerceProvider: CommerceProvider = new MockCommerceProvider();
