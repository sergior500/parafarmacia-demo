import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminOperation } from "@/server/admin-audit";
import {
  authorizeAdminMutation,
  authorizeAdminRead,
} from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import {
  activateShopifyInventory,
  listShopifyInventory,
  setShopifyInventoryQuantity,
} from "@/server/shopify/inventory";

export const dynamic = "force-dynamic";

const shopifyId = (resource: string) =>
  z.string().regex(new RegExp(`^gid://shopify/${resource}/\\d+(?:\\?.*)?$`));

const inventoryUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set"),
    inventoryItemId: shopifyId("InventoryItem"),
    locationId: shopifyId("Location"),
    quantity: z.number().int().min(0).max(999_999),
    compareQuantity: z.number().int().min(0).max(999_999),
  }),
  z.object({
    action: z.literal("activate"),
    inventoryItemId: shopifyId("InventoryItem"),
    locationId: shopifyId("Location"),
    quantity: z.number().int().min(0).max(999_999),
  }),
]);

export async function GET() {
  const authorization = await authorizeAdminRead("inventory:read");
  if (authorization.response) return authorization.response;
  try {
    return NextResponse.json({ report: await listShopifyInventory() });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo consultar el inventario.",
      },
      { status: 409 },
    );
  }
}

export async function PATCH(request: Request) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "inventory:write",
    rateLimit: ADMIN_RATE_LIMITS.inventory,
  });
  if (authorization.response) return authorization.response;
  const { actor } = authorization;
  let body: unknown;
  try {
    body = await readLimitedJsonBody(request, 8 * 1024);
  } catch (error) {
    return (
      requestBodyErrorResponse(error) ??
      NextResponse.json(
        { error: "No se pudo leer la petición." },
        { status: 400 },
      )
    );
  }
  const parsed = inventoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Los datos de inventario no son válidos." },
      { status: 400 },
    );
  }
  try {
    const result =
      parsed.data.action === "activate"
        ? await activateShopifyInventory(parsed.data)
        : await setShopifyInventoryQuantity(parsed.data);
    await recordAdminOperation({
      actor,
      action: `inventory.${parsed.data.action}`,
      resourceType: "shopify_inventory_item",
      resourceId: parsed.data.inventoryItemId,
      metadata: {
        locationId: parsed.data.locationId,
        quantity: parsed.data.quantity,
      },
    });
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el inventario.",
      },
      { status: 409 },
    );
  }
}
