import { describe, expect, it } from "vitest";

import {
  buildOrderCancellationVariables,
  buildOrdersReport,
  canCancelShopifyOrder,
  canFulfillShopifyOrder,
  mapFulfillmentOrders,
  orderHasCapturedPayment,
} from "@/server/shopify/orders";

function order(
  id: string,
  createdAt: string,
  amount: string,
  options: {
    financial?: string;
    fulfillment?: string;
    cancelledAt?: string | null;
    product?: string;
    quantity?: number;
  } = {},
) {
  return {
    id: `gid://shopify/Order/${id}`,
    legacyResourceId: id,
    name: `#${id}`,
    createdAt,
    cancelledAt: options.cancelledAt ?? null,
    fullyPaid: (options.financial ?? "PAID") === "PAID",
    displayFinancialStatus: options.financial ?? "PAID",
    displayFulfillmentStatus: options.fulfillment ?? "UNFULFILLED",
    email: "cliente@example.com",
    customer: { displayName: "Cliente" },
    displayAddress: { name: "Cliente", city: "Jaén", province: "Jaén" },
    currentTotalPriceSet: {
      shopMoney: { amount, currencyCode: "EUR" },
    },
    lineItems: {
      nodes: [
        {
          name: options.product ?? "Crema facial",
          quantity: options.quantity ?? 1,
        },
      ],
    },
  };
}

describe("buildOrdersReport", () => {
  it("calcula ventas por día, semana y mes en la zona horaria de la farmacia", () => {
    const report = buildOrdersReport(
      [
        order("1", "2026-08-15T08:00:00.000Z", "25.50", { quantity: 2 }),
        order("2", "2026-08-11T12:00:00.000Z", "10.00"),
        order("3", "2026-08-02T12:00:00.000Z", "15.00"),
      ],
      {
        now: new Date("2026-08-15T12:00:00.000Z"),
        timeZone: "Europe/Madrid",
      },
    );

    expect(report.metrics.todaySales).toBe(25.5);
    expect(report.metrics.weekSales).toBe(35.5);
    expect(report.metrics.monthSales).toBe(50.5);
    expect(report.metrics.monthOrders).toBe(3);
    expect(report.topProducts[0]).toEqual({
      name: "Crema facial",
      quantity: 4,
    });
  });

  it("excluye cancelados y pagos pendientes de las ventas", () => {
    const report = buildOrdersReport(
      [
        order("1", "2026-08-15T08:00:00.000Z", "25.50", {
          cancelledAt: "2026-08-15T09:00:00.000Z",
        }),
        order("2", "2026-08-15T10:00:00.000Z", "10.00", {
          financial: "PENDING",
        }),
        order("3", "2026-08-15T11:00:00.000Z", "5.00", {
          fulfillment: "FULFILLED",
        }),
      ],
      { now: new Date("2026-08-15T12:00:00.000Z") },
    );

    expect(report.metrics.todaySales).toBe(5);
    expect(report.metrics.monthOrders).toBe(2);
    expect(report.metrics.pendingPreparation).toBe(0);
  });
});

describe("mapFulfillmentOrders", () => {
  it("solo devuelve preparaciones abiertas con unidades pendientes", () => {
    const result = mapFulfillmentOrders([
      {
        id: "gid://shopify/FulfillmentOrder/1",
        status: "OPEN",
        assignedLocation: {
          name: "Farmacia Picual",
          location: { id: "gid://shopify/Location/1" },
        },
        lineItems: {
          nodes: [
            {
              id: "gid://shopify/FulfillmentOrderLineItem/1",
              remainingQuantity: 2,
              lineItem: { name: "Crema facial", sku: "PIC-1" },
            },
          ],
        },
      },
      {
        id: "gid://shopify/FulfillmentOrder/2",
        status: "CLOSED",
        assignedLocation: null,
        lineItems: {
          nodes: [
            {
              id: "gid://shopify/FulfillmentOrderLineItem/2",
              remainingQuantity: 1,
              lineItem: { name: "Gel", sku: null },
            },
          ],
        },
      },
    ]);

    expect(result).toEqual([
      {
        id: "gid://shopify/FulfillmentOrder/1",
        status: "OPEN",
        locationId: "gid://shopify/Location/1",
        locationName: "Farmacia Picual",
        items: [
          {
            id: "gid://shopify/FulfillmentOrderLineItem/1",
            name: "Crema facial",
            sku: "PIC-1",
            remainingQuantity: 2,
          },
        ],
      },
    ]);
  });
});

describe("canFulfillShopifyOrder", () => {
  const pendingFulfillment = [
    {
      id: "gid://shopify/FulfillmentOrder/1",
      status: "OPEN",
      locationName: "Farmacia Picual",
      items: [],
    },
  ];

  it("solo permite enviar pedidos pagados, activos y con preparación pendiente", () => {
    expect(
      canFulfillShopifyOrder({
        cancelled: false,
        fullyPaid: true,
        fulfillmentOrders: pendingFulfillment,
      }),
    ).toBe(true);
    expect(
      canFulfillShopifyOrder({
        cancelled: false,
        fullyPaid: false,
        fulfillmentOrders: pendingFulfillment,
      }),
    ).toBe(false);
    expect(
      canFulfillShopifyOrder({
        cancelled: true,
        fullyPaid: true,
        fulfillmentOrders: pendingFulfillment,
      }),
    ).toBe(false);
    expect(
      canFulfillShopifyOrder({
        cancelled: false,
        fullyPaid: true,
        fulfillmentOrders: [],
      }),
    ).toBe(false);
  });
});

describe("order cancellation", () => {
  it("solo ofrece cancelación antes del envío y detecta importes cobrados", () => {
    expect(
      canCancelShopifyOrder({
        cancelled: false,
        fulfillmentStatus: "UNFULFILLED",
      }),
    ).toBe(true);
    expect(
      canCancelShopifyOrder({
        cancelled: false,
        fulfillmentStatus: "FULFILLED",
      }),
    ).toBe(false);
    expect(
      canCancelShopifyOrder({
        cancelled: false,
        fulfillmentStatus: "PARTIALLY_FULFILLED",
      }),
    ).toBe(false);
    expect(
      canCancelShopifyOrder({
        cancelled: true,
        fulfillmentStatus: "UNFULFILLED",
      }),
    ).toBe(false);
    expect(orderHasCapturedPayment({ financialStatus: "PAID" })).toBe(true);
    expect(orderHasCapturedPayment({ financialStatus: "PARTIALLY_PAID" })).toBe(
      true,
    );
    expect(orderHasCapturedPayment({ financialStatus: "AUTHORIZED" })).toBe(
      false,
    );
  });

  it("construye una cancelación completa sin enviar campos del cliente", () => {
    expect(
      buildOrderCancellationVariables("1001", {
        operationId: "5f25bdb4-41c0-4d9e-9184-cad5f23189da",
        confirmation: "#1001",
        reason: "CUSTOMER",
        staffNote: "El cliente solicita cancelar el pedido.",
        notifyCustomer: true,
        restock: true,
        refundOriginalPaymentMethods: true,
      }),
    ).toEqual({
      orderId: "gid://shopify/Order/1001",
      notifyCustomer: true,
      refundMethod: { originalPaymentMethodsRefund: true },
      restock: true,
      reason: "CUSTOMER",
      staffNote: "El cliente solicita cancelar el pedido.",
    });
  });
});
