import type { ReactNode } from "react";

import { AdminNav } from "@/features/admin/admin-nav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminNav />
      <div className="page-shell py-10">{children}</div>
    </>
  );
}
