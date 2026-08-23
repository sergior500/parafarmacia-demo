import type { AdminActor } from "@/server/admin-auth";
import type { AdminRole } from "@/server/admin-roles";

export function validateAdminUserChange(input: {
  actor: Pick<AdminActor, "email" | "role">;
  current: { email: string; role: string; enabled: boolean };
  next: { role: AdminRole; enabled: boolean };
  enabledOwners: number;
}): string | null {
  const isSelf =
    input.current.email.toLowerCase() === input.actor.email.toLowerCase();
  if (isSelf && (!input.next.enabled || input.next.role !== input.actor.role)) {
    return "No puedes desactivar ni cambiar tu propio rol.";
  }
  if (
    input.current.enabled &&
    input.current.role === "owner" &&
    (!input.next.enabled || input.next.role !== "owner") &&
    input.enabledOwners <= 1
  ) {
    return "Debe permanecer al menos un propietario activo.";
  }
  return null;
}
