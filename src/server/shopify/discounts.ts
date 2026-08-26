import {
  shopifyAdminGraphql,
  ShopifyApiError,
} from "@/server/shopify/admin-api";

const DISCOUNTS_QUERY = `
  query PicualDiscounts($first: Int!, $after: String) {
    codeDiscountNodes(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        codeDiscount {
          __typename
          ... on DiscountCodeBasic {
            title status summary startsAt endsAt
            codes(first: 1) { nodes { code } }
          }
          ... on DiscountCodeFreeShipping {
            title status summary startsAt endsAt
            codes(first: 1) { nodes { code } }
          }
          ... on DiscountCodeBxgy {
            title status summary startsAt endsAt
            codes(first: 1) { nodes { code } }
          }
        }
      }
    }
  }
`;

const CREATE_BASIC_DISCOUNT_MUTATION = `
  mutation PicualDiscountCreate($input: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $input) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title status summary startsAt endsAt
            codes(first: 1) { nodes { code } }
          }
        }
      }
      userErrors { field message code }
    }
  }
`;

const ACTIVATE_DISCOUNT_MUTATION = `
  mutation PicualDiscountActivate($id: ID!) {
    discountCodeActivate(id: $id) {
      codeDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

const DEACTIVATE_DISCOUNT_MUTATION = `
  mutation PicualDiscountDeactivate($id: ID!) {
    discountCodeDeactivate(id: $id) {
      codeDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

interface RawDiscount {
  __typename?: string;
  title?: string;
  status?: string;
  summary?: string;
  startsAt?: string;
  endsAt?: string | null;
  codes?: { nodes: Array<{ code: string }> };
}

interface ShopifyUserError {
  field?: string[];
  message: string;
  code?: string;
}

export interface ShopifyDiscountSummary {
  id: string;
  type: string;
  title: string;
  code: string;
  status: string;
  summary: string;
  startsAt: string;
  endsAt?: string;
}

export interface ShopifyDiscountsPage {
  discounts: ShopifyDiscountSummary[];
  hasNextPage: boolean;
  endCursor?: string;
}

export interface CreateBasicDiscountInput {
  title: string;
  code: string;
  kind: "percentage" | "fixed";
  value: number;
  endsAt?: string;
  usageLimit?: number;
  appliesOncePerCustomer: boolean;
}

export async function listShopifyDiscounts(
  after?: string,
): Promise<ShopifyDiscountsPage> {
  const cursor = normalizeDiscountCursor(after);
  const data = await shopifyAdminGraphql<{
    codeDiscountNodes: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Array<{ id: string; codeDiscount: RawDiscount }>;
    };
  }>(DISCOUNTS_QUERY, { first: 50, after: cursor });
  return {
    discounts: data.codeDiscountNodes.nodes.map(({ id, codeDiscount }) => ({
      id,
      type: codeDiscount.__typename ?? "Descuento",
      title: codeDiscount.title ?? "Promoción sin título",
      code: codeDiscount.codes?.nodes[0]?.code ?? "—",
      status: codeDiscount.status ?? "UNKNOWN",
      summary: codeDiscount.summary ?? "Sin resumen disponible",
      startsAt: codeDiscount.startsAt ?? new Date(0).toISOString(),
      endsAt: codeDiscount.endsAt ?? undefined,
    })),
    hasNextPage: data.codeDiscountNodes.pageInfo.hasNextPage,
    endCursor: data.codeDiscountNodes.pageInfo.endCursor ?? undefined,
  };
}

export async function createShopifyBasicDiscount(
  input: CreateBasicDiscountInput,
): Promise<{ id: string }> {
  const value =
    input.kind === "percentage"
      ? { percentage: input.value / 100 }
      : {
          discountAmount: {
            amount: input.value.toFixed(2),
            appliesOnEachItem: false,
          },
        };
  const data = await shopifyAdminGraphql<{
    discountCodeBasicCreate: {
      codeDiscountNode: { id: string } | null;
      userErrors: ShopifyUserError[];
    };
  }>(CREATE_BASIC_DISCOUNT_MUTATION, {
    input: {
      title: input.title,
      code: input.code,
      startsAt: new Date().toISOString(),
      endsAt: input.endsAt || null,
      context: { all: true },
      customerGets: { value, items: { all: true } },
      appliesOncePerCustomer: input.appliesOncePerCustomer,
      usageLimit: input.usageLimit ?? null,
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      },
    },
  });
  throwOnDiscountErrors(data.discountCodeBasicCreate.userErrors);
  if (!data.discountCodeBasicCreate.codeDiscountNode) {
    throw new ShopifyApiError("Shopify no ha creado la promoción.");
  }
  return { id: data.discountCodeBasicCreate.codeDiscountNode.id };
}

export async function setShopifyDiscountActive(
  id: string,
  active: boolean,
): Promise<void> {
  if (!isDiscountGid(id)) {
    throw new ShopifyApiError("El identificador de la promoción no es válido.");
  }
  if (active) {
    const data = await shopifyAdminGraphql<{
      discountCodeActivate: {
        codeDiscountNode: { id: string } | null;
        userErrors: ShopifyUserError[];
      };
    }>(ACTIVATE_DISCOUNT_MUTATION, { id });
    throwOnDiscountErrors(data.discountCodeActivate.userErrors);
    if (!data.discountCodeActivate.codeDiscountNode) {
      throw new ShopifyApiError("Shopify no ha activado la promoción.");
    }
    return;
  }
  const data = await shopifyAdminGraphql<{
    discountCodeDeactivate: {
      codeDiscountNode: { id: string } | null;
      userErrors: ShopifyUserError[];
    };
  }>(DEACTIVATE_DISCOUNT_MUTATION, { id });
  throwOnDiscountErrors(data.discountCodeDeactivate.userErrors);
  if (!data.discountCodeDeactivate.codeDiscountNode) {
    throw new ShopifyApiError("Shopify no ha pausado la promoción.");
  }
}

function throwOnDiscountErrors(errors: ShopifyUserError[]) {
  if (!errors.length) return;
  throw new ShopifyApiError(errors.map((error) => error.message).join(" · "));
}

export function isDiscountGid(value: string): boolean {
  return /^gid:\/\/shopify\/DiscountCodeNode\/\d+$/.test(value);
}

function normalizeDiscountCursor(value: string | undefined): string | null {
  const cursor = (value ?? "").trim();
  return cursor && cursor.length <= 512 ? cursor : null;
}
