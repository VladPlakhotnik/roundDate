import {
  getAdminAuditLogsPageData,
  normalizeAdminAuditLogFilters,
} from "@/admin/server/audit-logs";
import { AdminLogsView } from "@/views/admin-logs/AdminLogsView";

type AdminLogsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLogsPage({ searchParams }: AdminLogsPageProps) {
  const filters = normalizeAdminAuditLogFilters(await searchParams);
  const data = await getAdminAuditLogsPageData(filters);

  return <AdminLogsView data={data} filters={filters} />;
}
