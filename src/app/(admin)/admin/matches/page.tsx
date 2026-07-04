import {
  getAdminMatchesPageData,
  normalizeAdminMatchFilters,
  publishAdminEventMatchesAction,
  saveAdminEventMatchesAction,
} from "@/entities/events";
import { AdminMatchesView } from "@/views/admin-matches/AdminMatchesView";

type AdminMatchesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminMatchesPage({ searchParams }: AdminMatchesPageProps) {
  const filters = normalizeAdminMatchFilters(await searchParams);
  const data = await getAdminMatchesPageData(filters);

  return (
    <AdminMatchesView
      data={data}
      publishMatchesAction={publishAdminEventMatchesAction}
      saveMatchesAction={saveAdminEventMatchesAction}
    />
  );
}
