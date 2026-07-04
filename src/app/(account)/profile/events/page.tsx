import { headers } from "next/headers";

import { getEvents } from "@/entities/events";
import { getProfileOnboardingState } from "@/entities/profile/server/onboarding";
import { ProfileEventsView } from "@/views/profile/events-page";

export default async function ProfileEventsPage() {
  const requestHeaders = new Headers(await headers());
  const [events, onboardingState] = await Promise.all([
    getEvents({
      statuses: ["published"],
    }),
    getProfileOnboardingState({ headers: requestHeaders }),
  ]);
  const bookingDefaults = onboardingState
    ? {
        email: onboardingState.user.email,
        firstName: onboardingState.profile.firstName,
        gender: onboardingState.profile.gender,
        lastName: onboardingState.profile.lastName,
        phone: onboardingState.profile.phone,
      }
    : undefined;

  return (
    <ProfileEventsView
      {...(bookingDefaults ? { bookingDefaults } : {})}
      events={events}
    />
  );
}
