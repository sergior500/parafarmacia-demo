import { env } from "cloudflare:workers";

export function getProductImageBucket(): R2Bucket {
  const bindings = env as unknown as { PRODUCT_IMAGES?: R2Bucket };
  if (!bindings.PRODUCT_IMAGES) {
    throw new Error("El almacén de imágenes no está disponible.");
  }
  return bindings.PRODUCT_IMAGES;
}
