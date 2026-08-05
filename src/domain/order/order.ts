import type { AuditEntry } from "@/domain/audit/audit";
import type { CartLine } from "@/domain/cart/cart";
import { calculateCartTotals } from "@/domain/cart/cart";
import type { Customer } from "@/domain/customer/customer";
import type { StaffRole, StaffUser } from "@/domain/user/user";

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: "Borrador",
  confirmed: "Confirmado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  lines: CartLine[];
  subtotalInCents: number;
  taxInCents: number;
  totalInCents: number;
  auditTrail: AuditEntry[];
  internalNotes: string[];
}

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: ["confirmed"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

const transitionRoles: Partial<Record<OrderStatus, readonly StaffRole[]>> = {
  preparing: ["owner", "order_manager"],
  shipped: ["owner", "order_manager"],
  delivered: ["owner", "order_manager"],
  cancelled: ["owner", "order_manager"],
  refunded: ["owner", "customer_support"],
};

export class OrderRuleError extends Error {
  constructor(
    public readonly code:
      "TRANSITION_NOT_ALLOWED" | "ROLE_NOT_ALLOWED" | "REASON_REQUIRED",
    message: string,
  ) {
    super(message);
    this.name = "OrderRuleError";
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

export function canViewOrder(role: StaffRole): boolean {
  return !["catalog_manager", "technical_admin"].includes(role);
}

export interface TransitionInput {
  to: OrderStatus;
  actor: StaffUser;
  reason?: string;
  internalNote?: string;
  now?: string;
}

export function transitionOrder(order: Order, input: TransitionInput): Order {
  if (!canTransition(order.status, input.to)) {
    throw new OrderRuleError(
      "TRANSITION_NOT_ALLOWED",
      `No se permite pasar de ${order.status} a ${input.to}.`,
    );
  }

  const allowedRoles = transitionRoles[input.to];
  if (allowedRoles && !allowedRoles.includes(input.actor.role)) {
    throw new OrderRuleError(
      "ROLE_NOT_ALLOWED",
      "Tu rol no permite realizar esta acción.",
    );
  }

  if (["cancelled", "refunded"].includes(input.to) && !input.reason?.trim()) {
    throw new OrderRuleError(
      "REASON_REQUIRED",
      "El motivo es obligatorio para esta acción.",
    );
  }

  const now = input.now ?? new Date().toISOString();
  const auditEntry: AuditEntry = {
    id: crypto.randomUUID(),
    orderId: order.id,
    previousStatus: order.status,
    newStatus: input.to,
    createdAt: now,
    userId: input.actor.id,
    userName: input.actor.name,
    reason: input.reason?.trim() || undefined,
    internalNote: input.internalNote?.trim() || undefined,
    action: "status_changed",
  };

  return {
    ...order,
    status: input.to,
    updatedAt: now,
    auditTrail: [...order.auditTrail, auditEntry],
    internalNotes: input.internalNote?.trim()
      ? [...order.internalNotes, input.internalNote.trim()]
      : order.internalNotes,
  };
}

export function addInternalNote(
  order: Order,
  actor: StaffUser,
  note: string,
  now = new Date().toISOString(),
): Order {
  const cleanNote = note.trim();
  if (!cleanNote) throw new Error("La nota no puede estar vacía.");

  return {
    ...order,
    updatedAt: now,
    internalNotes: [...order.internalNotes, cleanNote],
    auditTrail: [
      ...order.auditTrail,
      {
        id: crypto.randomUUID(),
        orderId: order.id,
        previousStatus: order.status,
        newStatus: order.status,
        createdAt: now,
        userId: actor.id,
        userName: actor.name,
        internalNote: cleanNote,
        action: "note_added",
      },
    ],
  };
}

export interface CreateOrderInput {
  id: string;
  reference: string;
  customer: Customer;
  lines: CartLine[];
  now?: string;
}

export function createConfirmedOrder(input: CreateOrderInput): Order {
  const now = input.now ?? new Date().toISOString();
  const totals = calculateCartTotals(input.lines);

  return {
    id: input.id,
    reference: input.reference,
    status: "confirmed",
    createdAt: now,
    updatedAt: now,
    customer: input.customer,
    lines: input.lines,
    ...totals,
    internalNotes: [],
    auditTrail: [
      {
        id: `${input.id}-confirmed`,
        orderId: input.id,
        previousStatus: "draft",
        newStatus: "confirmed",
        createdAt: now,
        userId: "demo-system",
        userName: "Sistema de demostración",
        action: "created",
      },
    ],
  };
}
