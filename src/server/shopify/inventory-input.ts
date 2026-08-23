import { z } from "zod";

const shopifyId = (resource: string) =>
  z.string().regex(new RegExp(`^gid://shopify/${resource}/\\d+(?:\\?.*)?$`));

const writableQuantity = z.number().int().min(0).max(999_999);

export const inventoryUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set"),
    inventoryItemId: shopifyId("InventoryItem"),
    locationId: shopifyId("Location"),
    quantity: writableQuantity,
    // Shopify can expose a negative available quantity when existing orders
    // have committed more units than the item had on hand. We accept that
    // signed snapshot only for compare-and-set; the new value remains >= 0.
    changeFromQuantity: z.number().int().min(-999_999).max(999_999),
  }),
  z.object({
    action: z.literal("activate"),
    inventoryItemId: shopifyId("InventoryItem"),
    locationId: shopifyId("Location"),
    quantity: writableQuantity,
  }),
]);
