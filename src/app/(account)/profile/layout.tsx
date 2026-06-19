import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getHomeEvents } from "@/entities/events";
import { getProfileOnboardingState } from "@/entities/profile/server/onboarding";
import { ProfileShell } from "@/views/profile/ProfileShell";

function getFirstName(input: { email: string; firstName: string; name: string }) {
  const firstName = input.firstName.trim();

  if (firstName) {
    return firstName;
  }

  const name = input.name.trim().split(/\s+/)[0];

  if (name) {
    return name;
  }

  return input.email.split("@")[0] ?? "гость";
}

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const onboardingState = await getProfileOnboardingState({
    headers: new Headers(requestHeaders),
  });

  if (!onboardingState) {
    redirect("/");
  }

  if (onboardingState.shouldShowOnboarding) {
    redirect("/onboarding");
  }

  const events = await getHomeEvents();
  const plannedCount = events[0] ? 1 : 0;
  const firstName = getFirstName({
    email: onboardingState.user.email,
    firstName: onboardingState.profile.firstName,
    name: onboardingState.user.name,
  });

  return (
    <ProfileShell firstName={firstName} plannedCount={plannedCount}>
      {children}
    </ProfileShell>
  );
}
