import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  activateShopifyInventory,
  mapInventoryReport,
} from "@/server/shopify/inventory";

const shopifyAdminGraphql = vi.hoisted(() => vi.fn());

vi.mock("@/server/shopify/admin-api", () => ({
  shopifyAdminGraphql,
  ShopifyApiError: class ShopifyApiError extends Error {},
}));

describe("mapInventoryReport", () => {
  it("resume seguimiento, stock bajo y agotados por ubicación", () => {
    const report = mapInventoryReport({
      locations: [
        {
          id: "gid://shopify/Location/1",
          name: "Farmacia Picual",
          isActive: true,
          fulfillsOnlineOrders: true,
          address: { city: "Jaén", province: "Jaén" },
        },
      ],
      items: [
        {
          id: "gid://shopify/InventoryItem/1",
          sku: "PICUAL-1",
          tracked: true,
          variant: {
            id: "gid://shopify/ProductVariant/1",
            title: "Default Title",
            product: {
              id: "gid://shopify/Product/1",
              title: "Aceite corporal",
              handle: "aceite-corporal",
              status: "DRAFT",
            },
          },
          inventoryLevels: {
            nodes: [
              {
                id: "gid://shopify/InventoryLevel/1",
                isActive: true,
                location: {
                  id: "gid://shopify/Location/1",
                  name: "Farmacia Picual",
                },
                quantities: [
                  { name: "available", quantity: 4 },
                  { name: "committed", quantity: 1 },
                  { name: "on_hand", quantity: 5 },
                ],
              },
            ],
          },
        },
        {
          id: "gid://shopify/InventoryItem/2",
          sku: null,
          tracked: false,
          variant: null,
          inventoryLevels: { nodes: [] },
        },
      ],
    });

    expect(report.metrics).toEqual({
      totalItems: 2,
      trackedItems: 1,
      lowStockLevels: 1,
      outOfStockLevels: 0,
    });
    expect(report.items[0]?.variantTitle).toBe("Formato único");
    expect(report.locations[0]?.city).toBe("Jaén");
  });
});

describe("activateShopifyInventory", () => {
  beforeEach(() => shopifyAdminGraphql.mockReset());

  it("sets the initial quantity when the location was already active", async () => {
    shopifyAdminGraphql
      .mockResolvedValueOnce({
        inventoryItemUpdate: {
          inventoryItem: { id: "item-1", tracked: true },
          userErrors: [],
        },
      })
      .mockResolvedValueOnce({
        inventoryItem: {
          inventoryLevel: {
            id: "level-1",
            isActive: true,
            location: { id: "location-1", name: "Farmacia" },
            quantities: [{ name: "available", quantity: 0 }],
          },
        },
      })
      .mockResolvedValueOnce({
        inventorySetQuantities: {
          inventoryAdjustmentGroup: {
            changes: [{ name: "available", delta: 1, quantityAfterChange: 1 }],
          },
          userErrors: [],
        },
      });

    await expect(
      activateShopifyInventory({
        inventoryItemId: "item-1",
        locationId: "location-1",
        quantity: 1,
      }),
    ).resolves.toEqual({ quantity: 1 });
    expect(shopifyAdminGraphql.mock.calls[2]?.[0]).toContain(
      "inventorySetQuantities",
    );
    expect(shopifyAdminGraphql.mock.calls[2]?.[1]).toMatchObject({
      input: { ignoreCompareQuantity: true },
    });
  });

  it("activates a new inventory level when the location is not stocked", async () => {
    shopifyAdminGraphql
      .mockResolvedValueOnce({
        inventoryItemUpdate: {
          inventoryItem: { id: "item-1", tracked: true },
          userErrors: [],
        },
      })
      .mockResolvedValueOnce({
        inventoryItem: { inventoryLevel: null },
      })
      .mockResolvedValueOnce({
        inventoryActivate: {
          inventoryLevel: {
            id: "level-1",
            isActive: true,
            location: { id: "location-1", name: "Farmacia" },
            quantities: [{ name: "available", quantity: 2 }],
          },
          userErrors: [],
        },
      });

    await expect(
      activateShopifyInventory({
        inventoryItemId: "item-1",
        locationId: "location-1",
        quantity: 2,
      }),
    ).resolves.toEqual({ quantity: 2 });
    expect(shopifyAdminGraphql.mock.calls[2]?.[0]).toContain(
      "inventoryActivate",
    );
  });
});
