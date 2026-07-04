import { ProfileBookingsView } from "@/views/profile/bookings-page";

type ProfileBookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfileBookingsPage({ searchParams }: ProfileBookingsPageProps) {
  const params = await searchParams;

  return (
    <ProfileBookingsView
      checkoutSessionId={readSearchParam(params.session_id)}
      paymentState={readSearchParam(params.payment)}
    />
  );
}
