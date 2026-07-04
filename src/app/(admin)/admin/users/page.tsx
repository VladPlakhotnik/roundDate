import {
  banAdminUserAction,
  getAdminUsersPageData,
  normalizeAdminUserFilters,
  unbanAdminUserAction,
} from "@/admin/server/users";
import { AdminUsersView } from "@/views/admin-users/AdminUsersView";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const filters = normalizeAdminUserFilters(await searchParams);
  const data = await getAdminUsersPageData(filters);

  return (
    <AdminUsersView
      banUserAction={banAdminUserAction}
      data={data}
      filters={filters}
      unbanUserAction={unbanAdminUserAction}
    />
  );
}
