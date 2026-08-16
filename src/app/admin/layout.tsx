import type { ReactNode } from "react";

import { AdminNav } from "@/features/admin/admin-nav";
import { requireAdminActor } from "@/server/admin-auth";

// Every admin page depends on per-request identity headers supplied by Sites.
// Prevent Vinext/Next from probing or prerendering the protected tree without
// the authenticated visitor context.
export const dynamic = "force-dynamic";

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
