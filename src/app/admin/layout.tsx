import type { ReactNode } from "react";

import { AdminNav } from "@/features/admin/admin-nav";
import { requireAdminActor } from "@/server/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await requireAdminActor("/admin");
  return (
    <>
      <AdminNav actorLabel={actor.displayName} />
      <div className="page-shell py-10">{children}</div>
    </>
  );
}
