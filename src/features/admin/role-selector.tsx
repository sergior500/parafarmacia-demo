"use client";

import { UserCog } from "lucide-react";

import { type StaffRole, staffRoleLabels } from "@/domain/user/user";
import { useDemo } from "@/features/demo/demo-provider";

const roles = Object.entries(staffRoleLabels) as Array<[StaffRole, string]>;

export function RoleSelector() {
  const { hydrated, role, setRole } = useDemo();

  if (process.env.NODE_ENV === "production") {
    return (
      <span className="bg-sage text-forest rounded-full px-4 py-2 text-xs font-bold">
        Rol demo: {staffRoleLabels[role]}
      </span>
    );
  }

  return (
    <label className="bg-sage text-forest flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-bold">
      <UserCog aria-hidden="true" className="size-4" />
      <span className="sr-only">Seleccionar rol de demostración</span>
      <select
        className="bg-transparent outline-none"
        data-testid="role-selector"
        disabled={!hydrated}
        value={role}
        onChange={(event) => setRole(event.target.value as StaffRole)}
      >
        {roles.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
