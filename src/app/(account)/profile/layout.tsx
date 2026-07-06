import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getUserBookings } from "@/entities/events";
import { getProfileOnboardingState } from "@/entities/profile/server/onboarding";
import { getRequestTranslator } from "@/shared/i18n/server";
import { ProfileShell } from "@/views/profile/ProfileShell";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Profil",
};

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

function toLogError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  let onboardingState: Awaited<ReturnType<typeof getProfileOnboardingState>>;
  let t: Awaited<ReturnType<typeof getRequestTranslator>>;

  try {
    [onboardingState, t] = await Promise.all([
      getProfileOnboardingState({
        headers: new Headers(requestHeaders),
      }),
      getRequestTranslator(),
    ]);
  } catch (error) {
    console.error("[profile/layout] Failed to load profile shell.", toLogError(error));

    throw error;
  }

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
