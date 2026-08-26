import {
  shopifyAdminGraphql,
  ShopifyApiError,
} from "@/server/shopify/admin-api";

const SHOP_TIME_ZONE = "Europe/Madrid";
const ORDER_WINDOW_DAYS = 60;
const MAX_ORDERS = 250;

const ORDERS_QUERY = `
  query PicualOrders($first: Int!, $query: String!) {
    shop { currencyCode }
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage }
      nodes {
        id
        legacyResourceId
        name
        createdAt
        cancelledAt
        fullyPaid
        displayFinancialStatus
        displayFulfillmentStatus
        email
        customer { displayName }
        displayAddress { name city province }
        currentTotalPriceSet { shopMoney { amount currencyCode } }
        lineItems(first: 100) { nodes { name quantity } }
      }
    }
  }
`;

const ORDER_DETAIL_QUERY = `
  query PicualOrderDetail($id: ID!) {
    order(id: $id) {
      id
      legacyResourceId
      name
      createdAt
      updatedAt
      cancelledAt
      cancelReason
      displayFinancialStatus
      displayFulfillmentStatus
      fullyPaid
      refundable
      presentmentCurrencyCode
      email
      phone
      note
      tags
      customer { displayName }
      displayAddress {
        name
        address1
        address2
        city
        province
        zip
        country
        phone
      }
      currentSubtotalPriceSet { shopMoney { amount currencyCode } }
      currentTotalDiscountsSet { shopMoney { amount currencyCode } }
      currentTotalTaxSet { shopMoney { amount currencyCode } }
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      totalShippingPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 100) {
        nodes {
          id
          name
          quantity
          refundableQuantity
          unfulfilledQuantity
          restockable
          sku
          variantTitle
          originalUnitPriceSet { shopMoney { amount currencyCode } }
          discountedTotalSet { shopMoney { amount currencyCode } }
        }
      }
      fulfillmentOrders(first: 20) {
        nodes {
          id
          status
          assignedLocation { name location { id } }
          lineItems(first: 100) {
            nodes {
              id
              remainingQuantity
              lineItem { id name sku }
            }
          }
        }
      }
      refunds {
        id
        createdAt
        note
        totalRefundedSet { shopMoney { amount currencyCode } }
        transactions(first: 10) { nodes { status } }
      }
    }
  }
`;

const FULFILLMENT_CREATE_MUTATION = `
  mutation PicualFulfillmentCreate(
    $fulfillment: FulfillmentInput!
    $idempotencyKey: String!
  ) {
    fulfillmentCreate(fulfillment: $fulfillment)
      @idempotent(key: $idempotencyKey) {
      fulfillment { id status createdAt }
      userErrors { field message }
    }
  }
`;

const ORDER_CANCEL_MUTATION = `
  mutation PicualOrderCancel(
    $orderId: ID!
    $notifyCustomer: Boolean!
    $refundMethod: OrderCancelRefundMethodInput!
    $restock: Boolean!
    $reason: OrderCancelReason!
    $staffNote: String!
  ) {
    orderCancel(
      orderId: $orderId
      notifyCustomer: $notifyCustomer
      refundMethod: $refundMethod
      restock: $restock
      reason: $reason
      staffNote: $staffNote
    ) {
      job { id done }
      orderCancelUserErrors { field message code }
    }
  }
`;

const REFUND_CREATE_MUTATION = `
  mutation PicualRefundCreate(
    $input: RefundInput!
    $idempotencyKey: String!
  ) {
    refundCreate(input: $input) @idempotent(key: $idempotencyKey) {
      refund {
        id
        createdAt
        note
        totalRefundedSet { presentmentMoney { amount currencyCode } }
        transactions(first: 10) { nodes { status } }
      }
      userErrors { field message }
    }
  }
`;

const REFUND_SUGGESTION_QUERY = `
  query PicualRefundSuggestion(
    $orderId: ID!
    $refundLineItems: [RefundLineItemInput!]
  ) {
    order(id: $orderId) {
      suggestedRefund(
        refundLineItems: $refundLineItems
        refundMethodAllocation: ORIGINAL_PAYMENT_METHODS
      ) {
        amountSet { presentmentMoney { amount currencyCode } }
        maximumRefundableSet { presentmentMoney { amount currencyCode } }
      }
    }
  }
`;

interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

interface ShopifyMoneySet {
  shopMoney: ShopifyMoney;
}

interface RawOrderSummary {
  id: string;
  legacyResourceId: string;
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  fullyPaid: boolean;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string;
  email: string | null;
  customer: { displayName: string } | null;
  displayAddress: {
    name: string | null;
    city: string | null;
    province: string | null;
  } | null;
  currentTotalPriceSet: ShopifyMoneySet;
  lineItems: { nodes: Array<{ name: string; quantity: number }> };
}

interface RawOrderDetail extends RawOrderSummary {
  updatedAt: string;
  cancelReason: string | null;
  fullyPaid: boolean;
  refundable: boolean;
  presentmentCurrencyCode: string;
  phone: string | null;
  note: string | null;
  tags: string[];
  displayAddress: {
    name: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
    phone: string | null;
  } | null;
  currentSubtotalPriceSet: ShopifyMoneySet;
  currentTotalDiscountsSet: ShopifyMoneySet;
  currentTotalTaxSet: ShopifyMoneySet;
  totalShippingPriceSet: ShopifyMoneySet;
  lineItems: {
    nodes: Array<{
      id: string;
      name: string;
      quantity: number;
      refundableQuantity: number;
      unfulfilledQuantity: number;
      restockable: boolean;
      sku: string | null;
      variantTitle: string | null;
      originalUnitPriceSet: ShopifyMoneySet;
      discountedTotalSet: ShopifyMoneySet;
    }>;
  };
  fulfillmentOrders: {
    nodes: Array<{
      id: string;
      status: string;
      assignedLocation: {
        name: string;
        location: { id: string } | null;
      } | null;
      lineItems: {
        nodes: Array<{
          id: string;
          remainingQuantity: number;
          lineItem: { id: string; name: string; sku: string | null } | null;
        }>;
      };
    }>;
  };
  refunds: Array<{
    id: string;
    createdAt: string;
    note: string | null;
    totalRefundedSet: ShopifyMoneySet;
    transactions: { nodes: Array<{ status: string }> };
  }>;
}

export interface ShopifyOrderSummary {
  id: string;
  legacyId: string;
  name: string;
  createdAt: string;
  customerName: string;
  customerEmail?: string;
  destination: string;
  financialStatus: string;
  fullyPaid: boolean;
  fulfillmentStatus: string;
  cancelled: boolean;
  amount: number;
  currencyCode: string;
  itemCount: number;
}

export interface ShopifyOrderDetail extends ShopifyOrderSummary {
  updatedAt: string;
  fullyPaid: boolean;
  refundable: boolean;
  presentmentCurrencyCode: string;
  phone?: string;
  note?: string;
  tags: string[];
  cancelReason?: string;
  address?: {
    name?: string;
    lines: string[];
    phone?: string;
  };
  subtotal: number;
  discounts: number;
  taxes: number;
  shipping: number;
  lineItems: Array<{
    id: string;
    name: string;
    quantity: number;
    refundableQuantity: number;
    unfulfilledQuantity: number;
    restockable: boolean;
    restockLocationId?: string;
    sku?: string;
    variantTitle?: string;
    unitPrice: number;
    total: number;
  }>;
  fulfillmentOrders: ShopifyFulfillmentOrder[];
  refunds: ShopifyRefundSummary[];
}

export interface ShopifyRefundSummary {
  id: string;
  createdAt: string;
  note?: string;
  amount: number;
  currencyCode: string;
  transactionStatus: string;
}

export interface ShopifyFulfillmentOrder {
  id: string;
  status: string;
  locationId?: string;
  locationName: string;
  items: Array<{
    id: string;
    lineItemId?: string;
    name: string;
    sku?: string;
    remainingQuantity: number;
  }>;
}

export interface ShopifyFulfillmentInput {
  operationId: string;
  notifyCustomer: boolean;
  trackingCompany?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export const SHOPIFY_ORDER_CANCEL_REASONS = [
  "CUSTOMER",
  "DECLINED",
  "FRAUD",
  "INVENTORY",
  "OTHER",
  "STAFF",
] as const;

export type ShopifyOrderCancelReason =
  (typeof SHOPIFY_ORDER_CANCEL_REASONS)[number];

export interface ShopifyOrderCancellationInput {
  operationId: string;
  confirmation: string;
  reason: ShopifyOrderCancelReason;
  staffNote: string;
  notifyCustomer: boolean;
  restock: boolean;
  refundOriginalPaymentMethods: boolean;
}

export interface ShopifyOrderCancellationResult {
  alreadyCancelled: boolean;
  job?: { id: string; done: boolean };
}

export interface ShopifyOrderRefundInput {
  operationId: string;
  confirmation: string;
  note: string;
  notifyCustomer: boolean;
  restock: boolean;
  lines: Array<{ lineItemId: string; quantity: number }>;
}

export interface ShopifyOrderRefundResult extends ShopifyRefundSummary {}

export interface ShopifyOrderRefundSuggestion {
  amount: number;
  maximumRefundable: number;
  currencyCode: string;
}

export interface ShopifyOrdersReport {
  currencyCode: string;
  orders: ShopifyOrderSummary[];
  hasMore: boolean;
  periodDays: number;
  generatedAt: string;
  metrics: {
    todaySales: number;
    weekSales: number;
    monthSales: number;
    monthOrders: number;
    pendingPreparation: number;
  };
  topProducts: Array<{ name: string; quantity: number }>;
}

export function canFulfillShopifyOrder(
  order: Pick<
    ShopifyOrderDetail,
    "cancelled" | "fullyPaid" | "fulfillmentOrders"
  >,
): boolean {
  return (
    !order.cancelled && order.fullyPaid && order.fulfillmentOrders.length > 0
  );
}

export function orderHasCapturedPayment(
  order: Pick<ShopifyOrderDetail, "financialStatus">,
): boolean {
  return ["PAID", "PARTIALLY_PAID", "PARTIALLY_REFUNDED"].includes(
    order.financialStatus,
  );
}

export function canCancelShopifyOrder(
  order: Pick<ShopifyOrderDetail, "cancelled" | "fulfillmentStatus">,
): boolean {
  return (
    !order.cancelled &&
    !["FULFILLED", "PARTIALLY_FULFILLED"].includes(order.fulfillmentStatus)
  );
}

export function canRefundShopifyOrder(
  order: Pick<
    ShopifyOrderDetail,
    "refundable" | "lineItems" | "financialStatus"
  >,
): boolean {
  return (
    order.refundable &&
    orderHasCapturedPayment(order) &&
    order.lineItems.some((item) => item.refundableQuantity > 0)
  );
}

export function buildOrderCancellationVariables(
  orderId: string,
  input: ShopifyOrderCancellationInput,
) {
  return {
    orderId: `gid://shopify/Order/${orderId}`,
    notifyCustomer: input.notifyCustomer,
    refundMethod: {
      originalPaymentMethodsRefund: input.refundOriginalPaymentMethods,
    },
    restock: input.restock,
    reason: input.reason,
    staffNote: input.staffNote,
  };
}

function moneyAmount(value: ShopifyMoneySet): number {
  const parsed = Number(value.shopMoney.amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDateParts(value: Date, timeZone = SHOP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function dayOrdinal(value: Date, timeZone = SHOP_TIME_ZONE): number {
  const { year, month, day } = getDateParts(value, timeZone);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function mapOrder(order: RawOrderSummary): ShopifyOrderSummary {
  const destination = [
    order.displayAddress?.city,
    order.displayAddress?.province,
  ]
    .filter(Boolean)
    .join(", ");
  return {
    id: order.id,
    legacyId: String(order.legacyResourceId),
    name: order.name,
    createdAt: order.createdAt,
    customerName:
      order.customer?.displayName ||
      order.displayAddress?.name ||
      order.email ||
      "Cliente invitado",
    customerEmail: order.email ?? undefined,
    destination: destination || "Sin dirección de envío",
    financialStatus: order.displayFinancialStatus ?? "UNKNOWN",
    fullyPaid: order.fullyPaid,
    fulfillmentStatus: order.displayFulfillmentStatus,
    cancelled: Boolean(order.cancelledAt),
    amount: moneyAmount(order.currentTotalPriceSet),
    currencyCode: order.currentTotalPriceSet.shopMoney.currencyCode,
    itemCount: order.lineItems.nodes.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
  };
}

function isCapturedSale(order: RawOrderSummary): boolean {
  return (
    !order.cancelledAt &&
    ["PAID", "PARTIALLY_PAID", "PARTIALLY_REFUNDED"].includes(
      order.displayFinancialStatus ?? "",
    )
  );
}

export function buildOrdersReport(
  rawOrders: RawOrderSummary[],
  options: {
    currencyCode?: string;
    hasMore?: boolean;
    now?: Date;
    timeZone?: string;
  } = {},
): ShopifyOrdersReport {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone ?? SHOP_TIME_ZONE;
  const today = dayOrdinal(now, timeZone);
  const todayParts = getDateParts(now, timeZone);
  const weekDay = new Date(today * 86_400_000).getUTCDay() || 7;
  const weekStart = today - (weekDay - 1);
  const monthKey = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}`;
  let todaySales = 0;
  let weekSales = 0;
  let monthSales = 0;
  let monthOrders = 0;
  let pendingPreparation = 0;
  const productQuantities = new Map<string, number>();

  for (const order of rawOrders) {
    const created = new Date(order.createdAt);
    const createdDay = dayOrdinal(created, timeZone);
    const parts = getDateParts(created, timeZone);
    const createdMonthKey = `${parts.year}-${String(parts.month).padStart(2, "0")}`;
    const amount = moneyAmount(order.currentTotalPriceSet);
    if (!order.cancelledAt && createdMonthKey === monthKey) monthOrders += 1;
    if (isCapturedSale(order)) {
      if (createdDay === today) todaySales += amount;
      if (createdDay >= weekStart && createdDay <= today) weekSales += amount;
      if (createdMonthKey === monthKey) monthSales += amount;
    }
    if (
      !order.cancelledAt &&
      order.fullyPaid &&
      !["FULFILLED", "RESTOCKED"].includes(order.displayFulfillmentStatus)
    ) {
      pendingPreparation += 1;
    }
    if (!order.cancelledAt) {
      for (const item of order.lineItems.nodes) {
        productQuantities.set(
          item.name,
          (productQuantities.get(item.name) ?? 0) + item.quantity,
        );
      }
    }
  }

  return {
    currencyCode:
      options.currencyCode ??
      rawOrders[0]?.currentTotalPriceSet.shopMoney.currencyCode ??
      "EUR",
    orders: rawOrders.map(mapOrder),
    hasMore: options.hasMore ?? false,
    periodDays: ORDER_WINDOW_DAYS,
    generatedAt: now.toISOString(),
    metrics: {
      todaySales,
      weekSales,
      monthSales,
      monthOrders,
      pendingPreparation,
    },
    topProducts: [...productQuantities.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5),
  };
}

export async function listShopifyOrders(): Promise<ShopifyOrdersReport> {
  const oldest = new Date(Date.now() - ORDER_WINDOW_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const data = await shopifyAdminGraphql<{
    shop: { currencyCode: string };
    orders: {
      pageInfo: { hasNextPage: boolean };
      nodes: RawOrderSummary[];
    };
  }>(ORDERS_QUERY, {
    first: MAX_ORDERS,
    query: `created_at:>=${oldest}`,
  });
  return buildOrdersReport(data.orders.nodes, {
    currencyCode: data.shop.currencyCode,
    hasMore: data.orders.pageInfo.hasNextPage,
  });
}

export async function getShopifyOrder(
  legacyId: string,
): Promise<ShopifyOrderDetail | null> {
  if (!/^\d+$/.test(legacyId)) return null;
  const data = await shopifyAdminGraphql<{ order: RawOrderDetail | null }>(
    ORDER_DETAIL_QUERY,
    { id: `gid://shopify/Order/${legacyId}` },
  );
  if (!data.order) return null;
  const order = data.order;
  const summary = mapOrder(order);
  const addressLines = order.displayAddress
    ? [
        order.displayAddress.address1,
        order.displayAddress.address2,
        [order.displayAddress.zip, order.displayAddress.city]
          .filter(Boolean)
          .join(" "),
        order.displayAddress.province,
        order.displayAddress.country,
      ].filter((line): line is string => Boolean(line))
    : [];
  return {
    ...summary,
    updatedAt: order.updatedAt,
    fullyPaid: order.fullyPaid,
    phone: order.phone ?? undefined,
    note: order.note ?? undefined,
    tags: order.tags,
    cancelReason: order.cancelReason ?? undefined,
    address: order.displayAddress
      ? {
          name: order.displayAddress.name ?? undefined,
          lines: addressLines,
          phone: order.displayAddress.phone ?? undefined,
        }
      : undefined,
    subtotal: moneyAmount(order.currentSubtotalPriceSet),
    discounts: moneyAmount(order.currentTotalDiscountsSet),
    taxes: moneyAmount(order.currentTotalTaxSet),
    shipping: moneyAmount(order.totalShippingPriceSet),
    lineItems: order.lineItems.nodes.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      refundableQuantity: item.refundableQuantity,
      unfulfilledQuantity: item.unfulfilledQuantity,
      restockable: item.restockable,
      restockLocationId: order.fulfillmentOrders.nodes.find((entry) =>
        entry.lineItems.nodes.some(
          (fulfillmentItem) => fulfillmentItem.lineItem?.id === item.id,
        ),
      )?.assignedLocation?.location?.id,
      sku: item.sku ?? undefined,
      variantTitle: item.variantTitle ?? undefined,
      unitPrice: moneyAmount(item.originalUnitPriceSet),
      total: moneyAmount(item.discountedTotalSet),
    })),
    fulfillmentOrders: mapFulfillmentOrders(order.fulfillmentOrders.nodes),
    refundable: order.refundable,
    presentmentCurrencyCode: order.presentmentCurrencyCode,
    refunds: order.refunds.map((refund) => ({
      id: refund.id,
      createdAt: refund.createdAt,
      note: refund.note ?? undefined,
      amount: moneyAmount(refund.totalRefundedSet),
      currencyCode: refund.totalRefundedSet.shopMoney.currencyCode,
      transactionStatus:
        refund.transactions.nodes.length > 0 &&
        refund.transactions.nodes.every(({ status }) => status === "SUCCESS")
          ? "SUCCESS"
          : (refund.transactions.nodes[0]?.status ?? "PENDING"),
    })),
  };
}

export function mapFulfillmentOrders(
  fulfillmentOrders: RawOrderDetail["fulfillmentOrders"]["nodes"],
): ShopifyFulfillmentOrder[] {
  return fulfillmentOrders
    .filter(
      (fulfillmentOrder) =>
        ["OPEN", "IN_PROGRESS"].includes(fulfillmentOrder.status) &&
        fulfillmentOrder.lineItems.nodes.some(
          (item) => item.remainingQuantity > 0,
        ),
    )
    .map((fulfillmentOrder) => ({
      id: fulfillmentOrder.id,
      status: fulfillmentOrder.status,
      locationId: fulfillmentOrder.assignedLocation?.location?.id,
      locationName:
        fulfillmentOrder.assignedLocation?.name ?? "Ubicación de la tienda",
      items: fulfillmentOrder.lineItems.nodes
        .filter((item) => item.remainingQuantity > 0)
        .map((item) => ({
          id: item.id,
          lineItemId: item.lineItem?.id,
          name: item.lineItem?.name ?? "Producto",
          sku: item.lineItem?.sku ?? undefined,
          remainingQuantity: item.remainingQuantity,
        })),
    }));
}

export async function fulfillShopifyOrder(
  legacyId: string,
  input: ShopifyFulfillmentInput,
) {
  const order = await getShopifyOrder(legacyId);
  if (!order) throw new ShopifyApiError("El pedido no existe en Shopify.");
  if (order.cancelled) {
    throw new ShopifyApiError("No se puede preparar un pedido cancelado.");
  }
  if (!order.fullyPaid) {
    throw new ShopifyApiError(
      "El pago todavía no está confirmado. No se puede registrar el envío.",
    );
  }
  if (!order.fulfillmentOrders.length) {
    throw new ShopifyApiError(
      "Este pedido no tiene productos pendientes de preparación.",
    );
  }

  const completed: Array<{ id: string; status: string }> = [];
  for (const [index, fulfillmentOrder] of order.fulfillmentOrders.entries()) {
    const trackingInfo =
      input.trackingNumber || input.trackingCompany || input.trackingUrl
        ? {
            company: input.trackingCompany || undefined,
            number: input.trackingNumber || undefined,
            url: input.trackingUrl || undefined,
          }
        : undefined;
    const data = await shopifyAdminGraphql<{
      fulfillmentCreate: {
        fulfillment: {
          id: string;
          status: string;
          createdAt: string;
        } | null;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    }>(FULFILLMENT_CREATE_MUTATION, {
      idempotencyKey: `${input.operationId}:${index}`,
      fulfillment: {
        lineItemsByFulfillmentOrder: [
          { fulfillmentOrderId: fulfillmentOrder.id },
        ],
        notifyCustomer: input.notifyCustomer,
        trackingInfo,
      },
    });
    if (data.fulfillmentCreate.userErrors.length) {
      throw new ShopifyApiError(
        data.fulfillmentCreate.userErrors
          .map((error) => error.message)
          .join(" · "),
      );
    }
    if (!data.fulfillmentCreate.fulfillment) {
      throw new ShopifyApiError("Shopify no ha creado el envío.");
    }
    completed.push({
      id: data.fulfillmentCreate.fulfillment.id,
      status: data.fulfillmentCreate.fulfillment.status,
    });
  }
  return { completed };
}

export async function cancelShopifyOrder(
  legacyId: string,
  input: ShopifyOrderCancellationInput,
): Promise<ShopifyOrderCancellationResult> {
  const order = await getShopifyOrder(legacyId);
  if (!order) throw new ShopifyApiError("El pedido no existe en Shopify.");
  if (order.cancelled) return { alreadyCancelled: true };
  if (!canCancelShopifyOrder(order)) {
    throw new ShopifyApiError(
      "Un pedido enviado total o parcialmente no puede cancelarse. Debe gestionarse como devolución o reembolso.",
    );
  }
  if (input.confirmation !== order.name) {
    throw new ShopifyApiError(
      `Escribe ${order.name} exactamente para confirmar la cancelación.`,
    );
  }
  if (orderHasCapturedPayment(order) && !input.refundOriginalPaymentMethods) {
    throw new ShopifyApiError(
      "Un pedido cobrado solo puede cancelarse desde este panel devolviendo el importe al método de pago original.",
    );
  }

  const data = await shopifyAdminGraphql<{
    orderCancel: {
      job: { id: string; done: boolean } | null;
      orderCancelUserErrors: Array<{
        field?: string[];
        message: string;
        code?: string;
      }>;
    };
  }>(ORDER_CANCEL_MUTATION, buildOrderCancellationVariables(legacyId, input));

  if (data.orderCancel.orderCancelUserErrors.length) {
    throw new ShopifyApiError(
      data.orderCancel.orderCancelUserErrors
        .map((error) => error.message)
        .join(" · "),
    );
  }
  if (!data.orderCancel.job) {
    throw new ShopifyApiError(
      "Shopify no ha confirmado la solicitud de cancelación.",
    );
  }
  return { alreadyCancelled: false, job: data.orderCancel.job };
}

export async function refundShopifyOrder(
  legacyId: string,
  input: ShopifyOrderRefundInput,
): Promise<ShopifyOrderRefundResult> {
  const order = await getShopifyOrder(legacyId);
  if (!order) throw new ShopifyApiError("El pedido no existe en Shopify.");
  if (!canRefundShopifyOrder(order)) {
    throw new ShopifyApiError(
      "Este pedido no admite más reembolsos mediante el método original.",
    );
  }
  if (input.confirmation !== order.name) {
    throw new ShopifyApiError(
      `Escribe ${order.name} exactamente para confirmar el reembolso.`,
    );
  }

  const requested = validateRequestedRefundLines(order, input.lines);
  const refundLineItems = requested.map(({ lineItemId, quantity, line }) => {
    if (!input.restock) {
      return { lineItemId, quantity, restockType: "NO_RESTOCK" };
    }
    if (!line.restockable) {
      throw new ShopifyApiError(
        "Una de las unidades seleccionadas no admite reposición de inventario.",
      );
    }
    if (!line.restockLocationId) {
      throw new ShopifyApiError(
        "No se puede reponer esta unidad porque Shopify no ha indicado una ubicación.",
      );
    }
    const restockType =
      line.unfulfilledQuantity >= quantity ? "CANCEL" : "RETURN";
    return {
      lineItemId,
      quantity,
      restockType,
      locationId: line.restockLocationId,
    };
  });

  const data = await shopifyAdminGraphql<{
    refundCreate: {
      refund: {
        id: string;
        createdAt: string;
        note: string | null;
        totalRefundedSet: { presentmentMoney: ShopifyMoney };
        transactions: { nodes: Array<{ status: string }> };
      } | null;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(REFUND_CREATE_MUTATION, {
    idempotencyKey: input.operationId,
    input: {
      orderId: order.id,
      currency: order.presentmentCurrencyCode,
      note: input.note,
      notify: input.notifyCustomer,
      allowOverRefunding: false,
      refundLineItems,
      transactions: [],
    },
  });
  if (data.refundCreate.userErrors.length) {
    throw new ShopifyApiError(
      data.refundCreate.userErrors.map((error) => error.message).join(" · "),
    );
  }
  const refund = data.refundCreate.refund;
  if (!refund) {
    throw new ShopifyApiError("Shopify no ha confirmado el reembolso.");
  }
  return {
    id: refund.id,
    createdAt: refund.createdAt,
    note: refund.note ?? undefined,
    amount: Number(refund.totalRefundedSet.presentmentMoney.amount) || 0,
    currencyCode: refund.totalRefundedSet.presentmentMoney.currencyCode,
    transactionStatus:
      refund.transactions.nodes.length > 0 &&
      refund.transactions.nodes.every(({ status }) => status === "SUCCESS")
        ? "SUCCESS"
        : (refund.transactions.nodes[0]?.status ?? "PENDING"),
  };
}

export async function suggestShopifyOrderRefund(
  legacyId: string,
  lines: ShopifyOrderRefundInput["lines"],
): Promise<ShopifyOrderRefundSuggestion> {
  const order = await getShopifyOrder(legacyId);
  if (!order) throw new ShopifyApiError("El pedido no existe en Shopify.");
  if (!canRefundShopifyOrder(order)) {
    throw new ShopifyApiError("Este pedido no admite más reembolsos.");
  }
  const requested = validateRequestedRefundLines(order, lines);
  const data = await shopifyAdminGraphql<{
    order: {
      suggestedRefund: {
        amountSet: { presentmentMoney: ShopifyMoney };
        maximumRefundableSet: { presentmentMoney: ShopifyMoney };
      } | null;
    } | null;
  }>(REFUND_SUGGESTION_QUERY, {
    orderId: order.id,
    refundLineItems: requested.map(({ lineItemId, quantity }) => ({
      lineItemId,
      quantity,
      restockType: "NO_RESTOCK",
    })),
  });
  const suggestion = data.order?.suggestedRefund;
  if (!suggestion) {
    throw new ShopifyApiError("Shopify no ha podido calcular el reembolso.");
  }
  return {
    amount: Number(suggestion.amountSet.presentmentMoney.amount) || 0,
    maximumRefundable:
      Number(suggestion.maximumRefundableSet.presentmentMoney.amount) || 0,
    currencyCode: suggestion.amountSet.presentmentMoney.currencyCode,
  };
}

function validateRequestedRefundLines(
  order: ShopifyOrderDetail,
  lines: ShopifyOrderRefundInput["lines"],
) {
  const requested = new Map<string, number>();
  for (const line of lines) {
    requested.set(
      line.lineItemId,
      (requested.get(line.lineItemId) ?? 0) + line.quantity,
    );
  }
  if (!requested.size) {
    throw new ShopifyApiError(
      "Selecciona al menos una unidad para reembolsar.",
    );
  }
  return Array.from(requested, ([lineItemId, quantity]) => {
    const line = order.lineItems.find((item) => item.id === lineItemId);
    if (!line || quantity < 1 || quantity > line.refundableQuantity) {
      throw new ShopifyApiError(
        "La cantidad solicitada ya no está disponible para reembolso.",
      );
    }
    return { lineItemId, quantity, line };
  });
}
