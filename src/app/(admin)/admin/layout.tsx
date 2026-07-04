import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireAdmin } from "@/admin/auth/require-admin";
import { AdminShell } from "@/admin/components/AdminShell";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Admin | RoundDate",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return <AdminShell user={user}>{children}</AdminShell>;
}
