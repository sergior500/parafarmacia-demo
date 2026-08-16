import { z } from "zod";

const checkoutLineSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutRequestSchema = z
  .object({
    lines: z.array(checkoutLineSchema).min(1).max(25),
    discountCode: z
      .string()
      .trim()
      .max(50)
      .regex(/^[A-Za-z0-9_-]*$/, "El código promocional no es válido.")
      .optional(),
  })
  .superRefine(({ lines }, context) => {
    const seen = new Set<string>();
    lines.forEach((line, index) => {
      if (seen.has(line.productId)) {
        context.addIssue({
          code: "custom",
          path: ["lines", index, "productId"],
          message: "El carrito contiene productos duplicados.",
        });
      }
      seen.add(line.productId);
    });
  });

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export interface ShopifyCheckoutLine {
  merchandiseId: string;
  quantity: number;
}

export function buildShopifyCartInput(
  lines: ShopifyCheckoutLine[],
  discountCode?: string,
) {
  return {
    attributes: [{ key: "source", value: "farmacia-picual" }],
    lines,
    ...(discountCode ? { discountCodes: [discountCode] } : {}),
  };
}

export function safeShopifyCheckoutUrl(value: string): string {
  let checkoutUrl: URL;
  try {
    checkoutUrl = new URL(value);
  } catch {
    throw new Error("Shopify no devolvió una dirección de pago válida.");
  }
  if (checkoutUrl.protocol !== "https:") {
    throw new Error("Shopify no devolvió una dirección de pago segura.");
  }
  return checkoutUrl.toString();
}
