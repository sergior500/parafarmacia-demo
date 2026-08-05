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
import type { Customer } from "@/domain/customer/customer";
import type { Order, OrderStatus } from "@/domain/order/order";
import type { Product } from "@/domain/product/product";
import type { StaffRole, StaffUser } from "@/domain/user/user";
import {
  parseStoredCart,
  parseStoredOrders,
} from "@/features/demo/storage-validation";
import { seededOrders } from "@/mocks/orders";
import { commerceProvider } from "@/providers/commerce/mock-commerce-provider";
import { orderManagementService } from "@/providers/order-management/mock-order-management-service";

const CART_KEY = "parafarmacia-demo-cart-v2";
const ORDERS_KEY = "parafarmacia-demo-orders-v2";
const ROLE_KEY = "parafarmacia-demo-role-v2";

const staffUsers: Record<StaffRole, StaffUser> = {
  owner: { id: "owner-demo", name: "Administración Demo", role: "owner" },
  order_manager: {
    id: "orders-demo",
    name: "Gestión Demo",
    role: "order_manager",
  },
  catalog_manager: {
    id: "catalog-demo",
    name: "Catálogo Demo",
    role: "catalog_manager",
  },
  customer_support: {
    id: "support-demo",
    name: "Atención Demo",
    role: "customer_support",
  },
  technical_admin: {
    id: "technical-demo",
    name: "Técnico Demo",
    role: "technical_admin",
  },
};

interface DemoContextValue {
  cart: CartLine[];
  orders: Order[];
  role: StaffRole;
  actor: StaffUser;
  lastOrderId: string | null;
  hydrated: boolean;
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  submitOrder: (customer: Customer) => Promise<Order>;
  transitionOrder: (
    orderId: string,
    to: OrderStatus,
    reason?: string,
    internalNote?: string,
  ) => Promise<Order>;
  addOrderNote: (orderId: string, note: string) => Promise<Order>;
  setRole: (role: StaffRole) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function isStaffRole(value: string): value is StaffRole {
  return Object.hasOwn(staffUsers, value);
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>(seededOrders);
  const [role, setRoleState] = useState<StaffRole>("owner");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const cartRef = useRef<CartLine[]>([]);
  const ordersRef = useRef<Order[]>(seededOrders);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- One-time hydration from demo-only browser storage. */
    const storedCart = parseStoredCart(localStorage.getItem(CART_KEY));
    const storedOrders = parseStoredOrders(localStorage.getItem(ORDERS_KEY));
    const storedRole = localStorage.getItem(ROLE_KEY);
    const initialCart = storedCart ?? [];
    const initialOrders = storedOrders ?? seededOrders;
    cartRef.current = initialCart;
    ordersRef.current = initialOrders;
    setCart(initialCart);
    setOrders(initialOrders);
    if (storedRole && isStaffRole(storedRole)) setRoleState(storedRole);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persistCart = useCallback((nextCart: CartLine[]) => {
    cartRef.current = nextCart;
    setCart(nextCart);
    localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
  }, []);

  const persistOrders = useCallback((nextOrders: Order[]) => {
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      const current = cartRef.current;
      const existing = current.find((line) => line.product.id === product.id);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      assertCanAddToCart(product, nextQuantity);
      const nextCart = existing
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: nextQuantity }
              : line,
          )
        : [...current, { product, quantity }];
      persistCart(nextCart);
    },
    [persistCart],
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      const nextCart = cartRef.current.map((line) => {
        if (line.product.id !== productId) return line;
        assertCanAddToCart(line.product, quantity);
        return { ...line, quantity };
      });
      persistCart(nextCart);
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

  const submitOrder = useCallback(
    async (customer: Customer): Promise<Order> => {
      const currentCart = cartRef.current;
      if (currentCart.length === 0) {
        throw new Error("El carrito está vacío.");
      }
      for (const line of currentCart) {
        assertCanAddToCart(line.product, line.quantity);
      }
      const order = await commerceProvider.submitOrderRequest(
        customer,
        currentCart,
      );
      persistOrders([order, ...ordersRef.current]);
      persistCart([]);
      setLastOrderId(order.id);
      return order;
    },
    [persistCart, persistOrders],
  );

  const transition = useCallback(
    async (
      orderId: string,
      to: OrderStatus,
      reason?: string,
      internalNote?: string,
    ): Promise<Order> => {
      const order = ordersRef.current.find((item) => item.id === orderId);
      if (!order) throw new Error("No se ha encontrado el pedido.");
      const updated = await orderManagementService.transition(order, {
        to,
        actor: staffUsers[role],
        reason,
        internalNote,
      });
      persistOrders(
        ordersRef.current.map((item) => (item.id === orderId ? updated : item)),
      );
      return updated;
    },
    [persistOrders, role],
  );

  const addOrderNote = useCallback(
    async (orderId: string, note: string): Promise<Order> => {
      const order = ordersRef.current.find((item) => item.id === orderId);
      if (!order) throw new Error("No se ha encontrado el pedido.");
      const updated = await orderManagementService.addNote(
        order,
        staffUsers[role],
        note,
      );
      persistOrders(
        ordersRef.current.map((item) => (item.id === orderId ? updated : item)),
      );
      return updated;
    },
    [persistOrders, role],
  );

  const setRole = useCallback((nextRole: StaffRole) => {
    setRoleState(nextRole);
    localStorage.setItem(ROLE_KEY, nextRole);
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      cart,
      orders,
      role,
      actor: staffUsers[role],
      lastOrderId,
      hydrated,
      cartCount: cart.reduce((count, line) => count + line.quantity, 0),
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      submitOrder,
      transitionOrder: transition,
      addOrderNote,
      setRole,
    }),
    [
      addOrderNote,
      addToCart,
      cart,
      clearCart,
      hydrated,
      lastOrderId,
      orders,
      removeFromCart,
      role,
      setRole,
      submitOrder,
      transition,
      updateCartQuantity,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo debe utilizarse dentro de DemoProvider.");
  }
  return context;
}
