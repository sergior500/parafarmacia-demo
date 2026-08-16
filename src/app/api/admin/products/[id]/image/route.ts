import { NextResponse } from "next/server";

import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  findAdminProduct,
  updateAdminProductImage,
} from "@/server/catalog-repository";
import { getProductImageBucket } from "@/server/product-image-bucket";
import {
  createProductImageKey,
  inspectProductImage,
  MAX_PRODUCT_IMAGE_BYTES,
  productImagePath,
} from "@/server/product-image-storage";

export const dynamic = "force-dynamic";

const MAX_MULTIPART_BYTES = MAX_PRODUCT_IMAGE_BYTES + 64 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "catalog:write",
    rateLimit: ADMIN_RATE_LIMITS.imageUpload,
  });
  if (authorization.response) return authorization.response;
  const { actor } = authorization;

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data;")) {
    return NextResponse.json(
      { error: "La imagen debe enviarse como formulario." },
      { status: 415 },
    );
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el máximo de 5 MB." },
      { status: 413 },
    );
  }

  const { id } = await context.params;
  const product = await findAdminProduct(id);
  if (!product) {
    return NextResponse.json(
      { error: "Producto no encontrado." },
      { status: 404 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer la imagen." },
      { status: 400 },
    );
  }
  const upload = formData.get("image");
  if (!(upload instanceof File) || upload.size === 0) {
    return NextResponse.json(
      { error: "Selecciona una imagen válida." },
      { status: 400 },
    );
  }
  if (upload.size > MAX_PRODUCT_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el máximo de 5 MB." },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await upload.arrayBuffer());
  const inspected = inspectProductImage(upload.type, bytes);
  if (!inspected) {
    return NextResponse.json(
      { error: "Usa una imagen JPEG, PNG o WebP válida." },
      { status: 415 },
    );
  }

  const key = createProductImageKey(inspected.extension);
  const bucket = getProductImageBucket();
  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType: inspected.contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      productId: product.id,
      uploadedBy: actor.userId,
    },
  });

  try {
    const updatedProduct = await updateAdminProductImage(
      product.id,
      productImagePath(key),
      actor,
    );
    if (!updatedProduct) throw new Error("Producto no encontrado.");
    return NextResponse.json({ product: updatedProduct });
  } catch {
    await bucket.delete(key);
    return NextResponse.json(
      { error: "No se pudo asociar la imagen al producto." },
      { status: 500 },
    );
  }
}
