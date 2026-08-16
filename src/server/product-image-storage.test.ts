import { describe, expect, it } from "vitest";

import {
  inspectProductImage,
  isValidProductImageKey,
  productImagePath,
} from "@/server/product-image-storage";

describe("product image storage", () => {
  it("accepts supported images only when their signature matches", () => {
    expect(
      inspectProductImage(
        "image/png",
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toEqual({ contentType: "image/png", extension: "png" });
    expect(
      inspectProductImage("image/png", new TextEncoder().encode("not an image")),
    ).toBeNull();
    expect(
      inspectProductImage("image/svg+xml", new TextEncoder().encode("<svg />")),
    ).toBeNull();
  });

  it("only exposes generated immutable keys", () => {
    const key = "123e4567-e89b-42d3-a456-426614174000.webp";
    expect(isValidProductImageKey(key)).toBe(true);
    expect(productImagePath(key)).toBe(`/media/product-images/${key}`);
    expect(isValidProductImageKey("../secret.webp")).toBe(false);
    expect(isValidProductImageKey("product.svg")).toBe(false);
  });
});
