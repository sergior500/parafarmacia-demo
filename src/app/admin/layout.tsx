import type { ReactNode } from "react";

import { AdminNav } from "@/features/admin/admin-nav";
import { getAdminActor } from "@/server/admin-auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const actor = await getAdminActor();
  return (
    <>
      <AdminNav actorLabel={actor?.displayName ?? "Sesión protegida"} />
      <div className="page-shell py-10">{children}</div>
    </>
  );
}
