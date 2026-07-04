import { headers } from "next/headers";

import { getUserMatchEvents } from "@/entities/events";
import { ProfileMatchesView } from "@/views/profile/matches-page";

export default async function ProfileMatchesPage() {
  const requestHeaders = await headers();
  const matchEvents = await getUserMatchEvents({ headers: new Headers(requestHeaders) });

  return <ProfileMatchesView matchEvents={matchEvents} />;
}
