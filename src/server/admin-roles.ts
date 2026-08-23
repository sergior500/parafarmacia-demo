export type AdminRole =
  "owner" | "catalog_manager" | "operations_manager" | "auditor";

export function adminRoleLabel(role: AdminRole): string {
  return {
    owner: "Propietario",
    catalog_manager: "Catálogo",
    operations_manager: "Operaciones",
    auditor: "Solo lectura",
  }[role];
}

export function isAdminRole(value: string): value is AdminRole {
  return ["owner", "catalog_manager", "operations_manager", "auditor"].includes(
    value,
  );
}
