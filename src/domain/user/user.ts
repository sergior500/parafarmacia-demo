export type StaffRole =
  | "owner"
  | "order_manager"
  | "catalog_manager"
  | "customer_support"
  | "technical_admin";

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
}

export const staffRoleLabels: Record<StaffRole, string> = {
  owner: "Administrador/a",
  order_manager: "Gestión de pedidos",
  catalog_manager: "Gestión de catálogo",
  customer_support: "Atención al cliente",
  technical_admin: "Administración técnica",
};
