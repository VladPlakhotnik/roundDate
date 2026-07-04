import {
  createAdminVenueAction,
  deleteAdminVenueAction,
  getAdminVenuesPageData,
  normalizeAdminVenueFilters,
  updateAdminVenueAction,
} from "@/admin/server/venues";
import { AdminVenuesView } from "@/views/admin-venues/AdminVenuesView";

type AdminAddressesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAddressesPage({ searchParams }: AdminAddressesPageProps) {
  const filters = normalizeAdminVenueFilters(await searchParams);
  const data = await getAdminVenuesPageData(filters);

  return (
    <AdminVenuesView
      createVenueAction={createAdminVenueAction}
      data={data}
      deleteVenueAction={deleteAdminVenueAction}
      filters={filters}
      updateVenueAction={updateAdminVenueAction}
    />
  );
}
