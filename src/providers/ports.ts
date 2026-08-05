import type { AuditEntry } from "@/domain/audit/audit";
import type { CartLine } from "@/domain/cart/cart";
import type { Customer } from "@/domain/customer/customer";
import type { Order, OrderStatus, TransitionInput } from "@/domain/order/order";
import type {
  Category,
  Product,
  ProductFilters,
} from "@/domain/product/product";
import type { StaffUser } from "@/domain/user/user";

export interface CatalogProvider {
  listProducts(filters?: ProductFilters): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  listCategories(): Promise<Category[]>;
}

export interface InventoryProvider {
  getAvailableStock(productId: string): Promise<number>;
  isAvailable(productId: string, quantity: number): Promise<boolean>;
}

export interface CommerceProvider {
  submitOrderRequest(customer: Customer, lines: CartLine[]): Promise<Order>;
}

export interface PaymentProvider {
  readonly enabled: boolean;
  authorize(): Promise<never>;
}

export interface ShippingProvider {
  readonly enabled: boolean;
  quote(): Promise<never>;
}

export interface NotificationProvider {
  readonly enabled: boolean;
  send(): Promise<void>;
}

export interface OrderRepository {
  list(): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

export interface AuditRepository {
  listByOrderId(orderId: string): Promise<AuditEntry[]>;
  append(entry: AuditEntry): Promise<void>;
}

export interface OrderManagementService {
  transition(order: Order, input: TransitionInput): Promise<Order>;
  addNote(order: Order, actor: StaffUser, note: string): Promise<Order>;
  availableActions(order: Order, actor: StaffUser): Promise<OrderStatus[]>;
}
