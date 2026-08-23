import {
  shopifyAdminGraphql,
  ShopifyApiError,
} from "@/server/shopify/admin-api";

const INVENTORY_QUERY = `
  query PicualInventory($first: Int!) {
    locations(first: 50) {
      nodes { id name isActive fulfillsOnlineOrders address { city province } }
    }
    inventoryItems(first: $first) {
      pageInfo { hasNextPage }
      nodes {
        id
        sku
        tracked
        variant { id title product { id title handle status } }
        inventoryLevels(first: 50) {
          nodes {
            id
            isActive
            location { id name }
            quantities(names: ["available", "committed", "on_hand"]) {
              name
              quantity
            }
          }
        }
      }
    }
  }
`;

const SET_INVENTORY_MUTATION = `
  mutation PicualInventorySet(
    $input: InventorySetQuantitiesInput!
    $idempotencyKey: String!
  ) {
    inventorySetQuantities(input: $input) @idempotent(key: $idempotencyKey) {
      inventoryAdjustmentGroup {
        changes { name delta quantityAfterChange }
      }
      userErrors { code field message }
    }
  }
`;

const TRACK_INVENTORY_MUTATION = `
  mutation PicualInventoryTrack($id: ID!, $input: InventoryItemInput!) {
    inventoryItemUpdate(id: $id, input: $input) {
      inventoryItem { id tracked }
      userErrors { field message }
    }
  }
`;

const INVENTORY_ITEM_LEVEL_QUERY = `
  query PicualInventoryItemLevel($inventoryItemId: ID!, $locationId: ID!) {
    inventoryItem(id: $inventoryItemId) {
      inventoryLevel(locationId: $locationId, includeInactive: true) {
        id
        isActive
        location { id name }
        quantities(names: ["available", "committed", "on_hand"]) {
          name
          quantity
        }
      }
    }
  }
`;

const ACTIVATE_INVENTORY_MUTATION = `
  mutation PicualInventoryActivate(
    $inventoryItemId: ID!
    $locationId: ID!
    $available: Int
    $idempotencyKey: String!
  ) {
    inventoryActivate(
      inventoryItemId: $inventoryItemId
      locationId: $locationId
      available: $available
    ) @idempotent(key: $idempotencyKey) {
      inventoryLevel {
        id
        isActive
        location { id name }
        quantities(names: ["available", "committed", "on_hand"]) {
          name
          quantity
        }
      }
      userErrors { field message }
    }
  }
`;

interface RawQuantity {
  name: string;
  quantity: number;
}

interface RawInventoryLevel {
  id: string;
  isActive: boolean;
  location: { id: string; name: string };
  quantities: RawQuantity[];
}

interface RawInventoryItem {
  id: string;
  sku: string | null;
  tracked: boolean;
  variant: {
    id: string;
    title: string;
    product: {
      id: string;
      title: string;
      handle: string;
      status: string;
    };
  } | null;
  inventoryLevels: { nodes: RawInventoryLevel[] };
}

export interface ShopifyLocation {
  id: string;
  name: string;
  isActive: boolean;
  fulfillsOnlineOrders: boolean;
  city?: string;
  province?: string;
}

export interface ShopifyInventoryLevel {
  id: string;
  locationId: string;
  locationName: string;
  isActive: boolean;
  available: number;
  committed: number;
  onHand: number;
}

export interface ShopifyInventoryItem {
  id: string;
  sku?: string;
  tracked: boolean;
  variantId?: string;
  variantTitle: string;
  productId?: string;
  productTitle: string;
  productHandle?: string;
  productStatus: string;
  levels: ShopifyInventoryLevel[];
}

export interface ShopifyInventoryReport {
  locations: ShopifyLocation[];
  items: ShopifyInventoryItem[];
  hasMore: boolean;
  generatedAt: string;
  metrics: {
    totalItems: number;
    trackedItems: number;
    lowStockLevels: number;
    outOfStockLevels: number;
  };
}

function quantity(quantities: RawQuantity[], name: string): number {
  return quantities.find((item) => item.name === name)?.quantity ?? 0;
}

export function mapInventoryReport(input: {
  locations: Array<{
    id: string;
    name: string;
    isActive: boolean;
    fulfillsOnlineOrders: boolean;
    address: { city: string | null; province: string | null } | null;
  }>;
  items: RawInventoryItem[];
  hasMore?: boolean;
}): ShopifyInventoryReport {
  const items = input.items.map((item) => ({
    id: item.id,
    sku: item.sku ?? undefined,
    tracked: item.tracked,
    variantId: item.variant?.id,
    variantTitle:
      item.variant?.title && item.variant.title !== "Default Title"
        ? item.variant.title
        : "Formato único",
    productId: item.variant?.product.id,
    productTitle: item.variant?.product.title ?? "Producto eliminado",
    productHandle: item.variant?.product.handle,
    productStatus: item.variant?.product.status ?? "ARCHIVED",
    levels: item.inventoryLevels.nodes.map((level) => ({
      id: level.id,
      locationId: level.location.id,
      locationName: level.location.name,
      isActive: level.isActive,
      available: quantity(level.quantities, "available"),
      committed: quantity(level.quantities, "committed"),
      onHand: quantity(level.quantities, "on_hand"),
    })),
  }));
  const activeLevels = items.flatMap((item) =>
    item.levels.filter((level) => level.isActive),
  );
  return {
    locations: input.locations.map((location) => ({
      id: location.id,
      name: location.name,
      isActive: location.isActive,
      fulfillsOnlineOrders: location.fulfillsOnlineOrders,
      city: location.address?.city ?? undefined,
      province: location.address?.province ?? undefined,
    })),
    items,
    hasMore: input.hasMore ?? false,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalItems: items.length,
      trackedItems: items.filter((item) => item.tracked).length,
      lowStockLevels: activeLevels.filter(
        (level) => level.available > 0 && level.available <= 5,
      ).length,
      outOfStockLevels: activeLevels.filter((level) => level.available <= 0)
        .length,
    },
  };
}

export async function listShopifyInventory(): Promise<ShopifyInventoryReport> {
  const data = await shopifyAdminGraphql<{
    locations: {
      nodes: Array<{
        id: string;
        name: string;
        isActive: boolean;
        fulfillsOnlineOrders: boolean;
        address: { city: string | null; province: string | null } | null;
      }>;
    };
    inventoryItems: {
      pageInfo: { hasNextPage: boolean };
      nodes: RawInventoryItem[];
    };
  }>(INVENTORY_QUERY, { first: 250 });
  return mapInventoryReport({
    locations: data.locations.nodes,
    items: data.inventoryItems.nodes,
    hasMore: data.inventoryItems.pageInfo.hasNextPage,
  });
}

export async function setShopifyInventoryQuantity(input: {
  inventoryItemId: string;
  locationId: string;
  quantity: number;
  changeFromQuantity: number;
}) {
  const data = await shopifyAdminGraphql<{
    inventorySetQuantities: {
      inventoryAdjustmentGroup: {
        changes: Array<{
          name: string;
          delta: number;
          quantityAfterChange: number;
        }>;
      } | null;
      userErrors: Array<{ code?: string; field?: string[]; message: string }>;
    };
  }>(SET_INVENTORY_MUTATION, {
    input: {
      name: "available",
      reason: "correction",
      referenceDocumentUri: "picual-admin://inventory/manual-correction",
      quantities: [
        {
          inventoryItemId: input.inventoryItemId,
          locationId: input.locationId,
          quantity: input.quantity,
          changeFromQuantity: input.changeFromQuantity,
        },
      ],
    },
    idempotencyKey: crypto.randomUUID(),
  });
  if (data.inventorySetQuantities.userErrors.length) {
    throw new ShopifyApiError(
      data.inventorySetQuantities.userErrors
        .map((error) => error.message)
        .join(" · "),
    );
  }
  const change =
    data.inventorySetQuantities.inventoryAdjustmentGroup?.changes.find(
      (item) => item.name === "available",
    );
  return { quantity: change?.quantityAfterChange ?? input.quantity };
}

export async function activateShopifyInventory(input: {
  inventoryItemId: string;
  locationId: string;
  quantity: number;
}) {
  const tracked = await shopifyAdminGraphql<{
    inventoryItemUpdate: {
      inventoryItem: { id: string; tracked: boolean } | null;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(TRACK_INVENTORY_MUTATION, {
    id: input.inventoryItemId,
    input: { tracked: true },
  });
  if (tracked.inventoryItemUpdate.userErrors.length) {
    throw new ShopifyApiError(
      tracked.inventoryItemUpdate.userErrors
        .map((error) => error.message)
        .join(" · "),
    );
  }

  const current = await shopifyAdminGraphql<{
    inventoryItem: { inventoryLevel: RawInventoryLevel | null } | null;
  }>(INVENTORY_ITEM_LEVEL_QUERY, {
    inventoryItemId: input.inventoryItemId,
    locationId: input.locationId,
  });

  if (current.inventoryItem?.inventoryLevel?.isActive) {
    const data = await shopifyAdminGraphql<{
      inventorySetQuantities: {
        inventoryAdjustmentGroup: {
          changes: Array<{
            name: string;
            delta: number;
            quantityAfterChange: number;
          }>;
        } | null;
        userErrors: Array<{ code?: string; field?: string[]; message: string }>;
      };
    }>(SET_INVENTORY_MUTATION, {
      input: {
        name: "available",
        reason: "correction",
        referenceDocumentUri: "picual-admin://inventory/activation",
        quantities: [
          {
            inventoryItemId: input.inventoryItemId,
            locationId: input.locationId,
            quantity: input.quantity,
            changeFromQuantity: null,
          },
        ],
      },
      idempotencyKey: crypto.randomUUID(),
    });
    if (data.inventorySetQuantities.userErrors.length) {
      throw new ShopifyApiError(
        data.inventorySetQuantities.userErrors
          .map((error) => error.message)
          .join(" · "),
      );
    }
    return { quantity: input.quantity };
  }

  const data = await shopifyAdminGraphql<{
    inventoryActivate: {
      inventoryLevel: RawInventoryLevel | null;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(ACTIVATE_INVENTORY_MUTATION, {
    inventoryItemId: input.inventoryItemId,
    locationId: input.locationId,
    available: input.quantity,
    idempotencyKey: crypto.randomUUID(),
  });
  if (data.inventoryActivate.userErrors.length) {
    throw new ShopifyApiError(
      data.inventoryActivate.userErrors
        .map((error) => error.message)
        .join(" · "),
    );
  }
  if (!data.inventoryActivate.inventoryLevel) {
    throw new ShopifyApiError("Shopify no ha activado el inventario.");
  }
  return { quantity: input.quantity };
}
