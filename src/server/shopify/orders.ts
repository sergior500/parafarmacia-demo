import { shopifyAdminGraphql } from "@/server/shopify/admin-api";

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
          sku
          variantTitle
          originalUnitPriceSet { shopMoney { amount currencyCode } }
          discountedTotalSet { shopMoney { amount currencyCode } }
        }
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
      sku: string | null;
      variantTitle: string | null;
      originalUnitPriceSet: ShopifyMoneySet;
      discountedTotalSet: ShopifyMoneySet;
    }>;
  };
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
  fulfillmentStatus: string;
  cancelled: boolean;
  amount: number;
  currencyCode: string;
  itemCount: number;
}

export interface ShopifyOrderDetail extends ShopifyOrderSummary {
  updatedAt: string;
  fullyPaid: boolean;
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
    sku?: string;
    variantTitle?: string;
    unitPrice: number;
    total: number;
  }>;
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
  const destination = [order.displayAddress?.city, order.displayAddress?.province]
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
      sku: item.sku ?? undefined,
      variantTitle: item.variantTitle ?? undefined,
      unitPrice: moneyAmount(item.originalUnitPriceSet),
      total: moneyAmount(item.discountedTotalSet),
    })),
  };
}

