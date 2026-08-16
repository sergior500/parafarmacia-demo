import { NextResponse } from "next/server";

import { getProductImageBucket } from "@/server/product-image-bucket";
import { isValidProductImageKey } from "@/server/product-image-storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params;
  if (!isValidProductImageKey(key)) {
    return NextResponse.json({ error: "Imagen no encontrada." }, { status: 404 });
  }

  const object = await getProductImageBucket().get(key);
  if (!object) {
    return NextResponse.json({ error: "Imagen no encontrada." }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}
