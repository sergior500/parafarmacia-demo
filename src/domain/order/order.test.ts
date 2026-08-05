import { describe, expect, it } from "vitest";

import {
  canViewOrder,
  createConfirmedOrder,
  transitionOrder,
} from "@/domain/order/order";
import type { StaffUser } from "@/domain/user/user";
import { products } from "@/mocks/products";

const owner: StaffUser = {
  id: "owner-test",
  name: "Administración Test",
  role: "owner",
};
const orderManager: StaffUser = {
  id: "orders-test",
  name: "Gestión Test",
  role: "order_manager",
};
const support: StaffUser = {
  id: "support-test",
  name: "Soporte Test",
  role: "customer_support",
};

function confirmedOrder() {
  return createConfirmedOrder({
    id: "order-test",
    reference: "DEMO-TEST",
    customer: {
      firstName: "Cliente",
      lastName: "Ficticio",
      email: "cliente@ejemplo.invalid",
      phone: "+34 600 000 000",
      address: "Calle Ficticia 1",
      postalCode: "41001",
      city: "Sevilla",
      province: "Sevilla",
    },
    lines: [{ product: products[0]!, quantity: 1 }],
    now: "2026-08-05T10:00:00.000Z",
  });
}

describe("flujo comercial de pedidos", () => {
  it("crea un pedido nuevo confirmado", () => {
    expect(confirmedOrder().status).toBe("confirmed");
  });

  it.each([owner, orderManager])(
    "permite iniciar la preparación a $role",
    (actor: StaffUser) => {
      expect(
        transitionOrder(confirmedOrder(), {
          to: "preparing",
          actor,
          now: "2026-08-05T10:05:00.000Z",
        }).status,
      ).toBe("preparing");
    },
  );

  it("impide gestionar la preparación a un rol sin permiso", () => {
    expect(() =>
      transitionOrder(confirmedOrder(), { to: "preparing", actor: support }),
    ).toThrowError(expect.objectContaining({ code: "ROLE_NOT_ALLOWED" }));
  });

  it("exige un motivo para cancelar", () => {
    expect(() =>
      transitionOrder(confirmedOrder(), {
        to: "cancelled",
        actor: orderManager,
      }),
    ).toThrowError(expect.objectContaining({ code: "REASON_REQUIRED" }));
  });

  it("rechaza una transición de estado no permitida", () => {
    expect(() =>
      transitionOrder(confirmedOrder(), {
        to: "shipped",
        actor: owner,
      }),
    ).toThrowError(expect.objectContaining({ code: "TRANSITION_NOT_ALLOWED" }));
  });

  it("genera una entrada de auditoría en cada transición", () => {
    const order = confirmedOrder();
    const preparing = transitionOrder(order, {
      to: "preparing",
      actor: orderManager,
      now: "2026-08-05T10:05:00.000Z",
    });
    expect(preparing.auditTrail).toHaveLength(order.auditTrail.length + 1);
    expect(preparing.auditTrail.at(-1)).toMatchObject({
      previousStatus: "confirmed",
      newStatus: "preparing",
      userId: orderManager.id,
    });
  });

  it("limita el acceso a datos de cliente para catálogo y sistemas", () => {
    expect(canViewOrder("catalog_manager")).toBe(false);
    expect(canViewOrder("technical_admin")).toBe(false);
    expect(canViewOrder("customer_support")).toBe(true);
  });
});
