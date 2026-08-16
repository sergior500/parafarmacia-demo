export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const productImageKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/;

const supportedImages = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  },
} as const;

export type SupportedProductImageType = keyof typeof supportedImages;

export function inspectProductImage(
  contentType: string,
  bytes: Uint8Array,
): { contentType: SupportedProductImageType; extension: string } | null {
  const normalizedType = contentType.trim().toLowerCase();
  if (!(normalizedType in supportedImages)) return null;
  const type = normalizedType as SupportedProductImageType;
  const definition = supportedImages[type];
  return definition.matches(bytes)
    ? { contentType: type, extension: definition.extension }
    : null;
}

export function createProductImageKey(extension: string): string {
  return `${crypto.randomUUID()}.${extension}`;
}

export function isValidProductImageKey(key: string): boolean {
  return productImageKeyPattern.test(key);
}

export function productImagePath(key: string): string {
  return `/media/product-images/${key}`;
}
