import { describe, expect, it } from "vitest";

import {
  parseStoredCart,
  parseStoredOrders,
} from "@/features/demo/storage-validation";
import { products } from "@/mocks/products";

describe("validación del almacenamiento demo", () => {
  it("rechaza un carrito manipulado", () => {
    expect(parseStoredCart('[{"quantity":999,"product":null}]')).toBeNull();
    expect(parseStoredCart("<script>")).toBeNull();
  });

  it("acepta un carrito local con la forma esperada", () => {
    const cart = [{ product: products[0]!, quantity: 1 }];
    expect(parseStoredCart(JSON.stringify(cart))).toEqual(cart);
  });

  it("rechaza pedidos sin auditoría ni cliente válido", () => {
    expect(
      parseStoredOrders(
        JSON.stringify([{ id: "tampered", status: "unknown" }]),
      ),
    ).toBeNull();
  });
});
