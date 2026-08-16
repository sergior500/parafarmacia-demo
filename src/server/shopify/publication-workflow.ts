import {
  type AdminCatalogProduct,
  canHideFromShopify,
  canPublishToShopify,
} from "@/features/admin/admin-catalog";
import type { AdminActor } from "@/server/admin-auth";
import {
  findAdminProduct,
  markProductPublicationChanged,
  markProductPublicationChanging,
  markProductPublicationError,
} from "@/server/catalog-repository";
import { setShopifyProductPublication } from "@/server/shopify/product-publication";

export function publicationEligibilityError(
  product: AdminCatalogProduct,
  action: "publish" | "hide",
): string | null {
  if (product.shopifySyncStatus !== "synced" || !product.shopifyProductId) {
    return "Sincroniza primero el producto con Shopify.";
  }
  if (action === "publish" && !canPublishToShopify(product)) {
    return "Para publicar, la ficha debe estar aprobada y tener precio, stock, formato e imagen.";
  }
  if (action === "hide" && !canHideFromShopify(product)) {
    return "El producto ya está oculto en la tienda.";
  }
  return null;
}

export async function changeProductPublication(
  product: AdminCatalogProduct,
  action: "publish" | "hide",
  actor: AdminActor,
): Promise<AdminCatalogProduct> {
  const eligibilityError = publicationEligibilityError(product, action);
  if (eligibilityError) throw new Error(eligibilityError);

  await markProductPublicationChanging(product.id);
  try {
    const result = await setShopifyProductPublication(
      product.shopifyProductId!,
      action,
    );
    await markProductPublicationChanged(
      product.id,
      result.published,
      result.publicationId,
      actor,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cambiar la visibilidad en Shopify.";
    await markProductPublicationError(product.id, message, action === "hide");
    throw new Error(message);
  }

  const updated = await findAdminProduct(product.id);
  if (!updated) throw new Error("No se pudo recuperar el producto actualizado.");
  return updated;
}
