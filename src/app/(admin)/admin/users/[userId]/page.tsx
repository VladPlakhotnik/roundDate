import { notFound } from "next/navigation";

import { getAdminUserDetailsPageData } from "@/admin/server/users";
import { AdminUserDetailsView } from "@/views/admin-user-details/AdminUserDetailsView";

type AdminUserDetailsPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function AdminUserDetailsPage({ params }: AdminUserDetailsPageProps) {
  const { userId } = await params;
  const data = await getAdminUserDetailsPageData(userId);

  if (!data) {
    notFound();
  }

  return <AdminUserDetailsView data={data} />;
}
