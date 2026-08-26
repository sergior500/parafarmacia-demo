import { shopifyAdminGraphql } from "@/server/shopify/admin-api";

const CUSTOMERS_PAGE_SIZE = 50;

const CUSTOMERS_QUERY = `
  query PicualCustomers($first: Int!, $after: String, $query: String) {
    customers(
      first: $first
      after: $after
      query: $query
      sortKey: UPDATED_AT
      reverse: true
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        displayName
        createdAt
        updatedAt
        state
        numberOfOrders
        tags
        amountSpent { amount currencyCode }
        defaultEmailAddress { emailAddress }
        defaultAddress { city province }
      }
    }
  }
`;

interface RawCustomer {
  id: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  numberOfOrders: number | string;
  tags: string[];
  amountSpent: { amount: string; currencyCode: string };
  defaultEmailAddress: { emailAddress: string } | null;
  defaultAddress: { city: string | null; province: string | null } | null;
}

export interface ShopifyCustomerSummary {
  id: string;
  displayName: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  numberOfOrders: number;
  amountSpent: number;
  currencyCode: string;
  location: string;
  tags: string[];
}

export interface ShopifyCustomersPage {
  customers: ShopifyCustomerSummary[];
  hasNextPage: boolean;
  endCursor?: string;
}

export async function listShopifyCustomers(
  input: {
    query?: string;
    after?: string;
  } = {},
): Promise<ShopifyCustomersPage> {
  const query = normalizeCustomerQuery(input.query);
  const after = normalizeCursor(input.after);
  const data = await shopifyAdminGraphql<{
    customers: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: RawCustomer[];
    };
  }>(CUSTOMERS_QUERY, {
    first: CUSTOMERS_PAGE_SIZE,
    after,
    query: query || null,
  });

  return {
    customers: data.customers.nodes.map(mapCustomer),
    hasNextPage: data.customers.pageInfo.hasNextPage,
    endCursor: data.customers.pageInfo.endCursor ?? undefined,
  };
}

function mapCustomer(customer: RawCustomer): ShopifyCustomerSummary {
  const location = [
    customer.defaultAddress?.city,
    customer.defaultAddress?.province,
  ]
    .filter(Boolean)
    .join(", ");
  return {
    id: customer.id,
    displayName: customer.displayName || "Cliente sin nombre",
    email: customer.defaultEmailAddress?.emailAddress || undefined,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    state: customer.state,
    numberOfOrders: Number(customer.numberOfOrders) || 0,
    amountSpent: Number(customer.amountSpent.amount) || 0,
    currencyCode: customer.amountSpent.currencyCode,
    location,
    tags: customer.tags.slice(0, 10),
  };
}

export function normalizeCustomerQuery(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 100);
}

function normalizeCursor(value: string | undefined): string | null {
  const cursor = (value ?? "").trim();
  return cursor && cursor.length <= 512 ? cursor : null;
}
