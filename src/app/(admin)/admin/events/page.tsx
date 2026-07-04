import {
  createAdminEventAction,
  deleteAdminEventAction,
  getAdminEventsPageData,
  normalizeAdminEventFilters,
  publishAdminEventAction,
  updateAdminEventAction,
} from "@/admin/server/events";
import { AdminEventsView } from "@/views/admin-events/AdminEventsView";

type AdminEventsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
  const filters = normalizeAdminEventFilters(await searchParams);
  const data = await getAdminEventsPageData(filters);

  return (
    <AdminEventsView
      admins={data.admins}
      createEventAction={createAdminEventAction}
      currentAdminId={data.currentAdminId}
      deleteEventAction={deleteAdminEventAction}
      events={data.events}
      filters={data.filters}
      publishEventAction={publishAdminEventAction}
      updateEventAction={updateAdminEventAction}
      venues={data.venues}
    />
  );
}
