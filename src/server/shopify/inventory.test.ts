import { describe, expect, it } from "vitest";

import { mapInventoryReport } from "@/server/shopify/inventory";

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
