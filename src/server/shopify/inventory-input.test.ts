import { describe, expect, it } from "vitest";

import { inventoryUpdateSchema } from "@/server/shopify/inventory-input";

const identifiers = {
  inventoryItemId: "gid://shopify/InventoryItem/123",
  locationId: "gid://shopify/Location/456",
};

describe("inventoryUpdateSchema", () => {
  it("accepts a negative Shopify snapshot for compare-and-set", () => {
    expect(
      inventoryUpdateSchema.safeParse({
        action: "set",
        ...identifiers,
        quantity: 1,
        compareQuantity: -1,
      }).success,
    ).toBe(true);
  });

  it("continues rejecting negative stock written by an administrator", () => {
    expect(
      inventoryUpdateSchema.safeParse({
        action: "set",
        ...identifiers,
        quantity: -1,
        compareQuantity: -1,
      }).success,
    ).toBe(false);
  });
});
