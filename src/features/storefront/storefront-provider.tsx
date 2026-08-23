"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { assertCanAddToCart, type CartLine } from "@/domain/cart/cart";
import type { Product } from "@/domain/product/product";
import { parseStoredCart } from "@/features/storefront/storage-validation";

const CART_KEY = "farmacia-picual-cart-v1";

interface StorefrontContextValue {
  cart: CartLine[];
  hydrated: boolean;
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const cartRef = useRef<CartLine[]>([]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- One-time hydration from validated browser storage. */
    const initialCart = parseStoredCart(localStorage.getItem(CART_KEY)) ?? [];
    cartRef.current = initialCart;
    setCart(initialCart);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persistCart = useCallback((nextCart: CartLine[]) => {
    cartRef.current = nextCart;
    setCart(nextCart);
    localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      const current = cartRef.current;
      const existing = current.find((line) => line.product.id === product.id);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      assertCanAddToCart(product, nextQuantity);
      persistCart(
        existing
          ? current.map((line) =>
              line.product.id === product.id
                ? { ...line, quantity: nextQuantity }
                : line,
            )
          : [...current, { product, quantity }],
      );
    },
    [persistCart],
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      persistCart(
        cartRef.current.map((line) => {
          if (line.product.id !== productId) return line;
          assertCanAddToCart(line.product, quantity);
          return { ...line, quantity };
        }),
      );
    },
    [persistCart],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      persistCart(
        cartRef.current.filter((line) => line.product.id !== productId),
      );
    },
    [persistCart],
  );

  const clearCart = useCallback(() => persistCart([]), [persistCart]);

  const value = useMemo<StorefrontContextValue>(
    () => ({
      cart,
      hydrated,
      cartCount: cart.reduce((count, line) => count + line.quantity, 0),
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
    }),
    [addToCart, cart, clearCart, hydrated, removeFromCart, updateCartQuantity],
  );

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront(): StorefrontContextValue {
  const context = useContext(StorefrontContext);
  if (!context) {
    throw new Error(
      "useStorefront debe utilizarse dentro de StorefrontProvider.",
    );
  }
  return context;
}
