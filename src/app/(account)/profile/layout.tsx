import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getUserBookings } from "@/entities/events";
import { getProfileOnboardingState } from "@/entities/profile/server/onboarding";
import { getRequestTranslator } from "@/shared/i18n/server";
import { ProfileShell } from "@/views/profile/ProfileShell";

function getFirstName(input: { email: string; fallback: string; firstName: string; name: string }) {
  const firstName = input.firstName.trim();

  if (firstName) {
    return firstName;
  }

  const name = input.name.trim().split(/\s+/)[0];

  if (name) {
    return name;
  }

  return input.email.split("@")[0] ?? input.fallback;
}

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const [onboardingState, t] = await Promise.all([
    getProfileOnboardingState({
      headers: new Headers(requestHeaders),
    }),
    getRequestTranslator(),
  ]);

  if (!onboardingState) {
    redirect("/");
  }

  if (onboardingState.shouldShowOnboarding) {
    redirect("/onboarding");
  }

  const plannedBookings = await getUserBookings({
    headers: new Headers(requestHeaders),
    scope: "upcoming",
  });
  const plannedCount = plannedBookings.length;
  const firstName = getFirstName({
    email: onboardingState.user.email,
    fallback: t("profile.fallbackUser"),
    firstName: onboardingState.profile.firstName,
    name: onboardingState.user.name,
  });

  return (
    <ProfileShell
      firstName={firstName}
      isAdmin={onboardingState.user.role === "admin" || onboardingState.user.role === "manager"}
      plannedCount={plannedCount}
    >
      {children}
    </ProfileShell>
  );
}
