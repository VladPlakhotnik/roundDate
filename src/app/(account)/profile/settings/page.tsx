import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getProfileOnboardingState } from "@/entities/profile/server/onboarding";
import { ProfileSettingsView } from "@/views/profile/settings-page";

function getDisplayName(input: {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
}) {
  const profileName = [input.firstName.trim(), input.lastName.trim()].filter(Boolean).join(" ");

  if (profileName) {
    return profileName;
  }

  const authName = input.name.trim();

  if (authName) {
    return authName;
  }

  return input.email.split("@")[0] ?? "Пользователь";
}

export default async function ProfileSettingsPage() {
  const requestHeaders = await headers();
  const onboardingState = await getProfileOnboardingState({
    headers: new Headers(requestHeaders),
  });

  if (!onboardingState) {
    redirect("/");
  }

  return (
    <ProfileSettingsView
      account={{
        displayName: getDisplayName({
          email: onboardingState.user.email,
          firstName: onboardingState.profile.firstName,
          lastName: onboardingState.profile.lastName,
          name: onboardingState.user.name,
        }),
        email: onboardingState.user.email,
        emailNotifications: onboardingState.profile.emailNotifications,
        eventCriteriaNotifications: onboardingState.profile.eventCriteriaNotifications,
        eventReminderNotifications: onboardingState.profile.eventReminderNotifications,
        eventResultNotifications: onboardingState.profile.eventResultNotifications,
        firstName: onboardingState.profile.firstName,
        hasPassword: onboardingState.hasPassword,
        image: onboardingState.user.image,
        lastName: onboardingState.profile.lastName,
        linkedProviders: onboardingState.linkedProviders,
        locale: onboardingState.profile.locale,
        marketingConsent: onboardingState.profile.marketingConsent,
        newDateNotifications: onboardingState.profile.newDateNotifications,
        phone: onboardingState.profile.phone,
        preferredDays: onboardingState.profile.preferredDays,
        preferredTimes: onboardingState.profile.preferredTimes,
        provider: onboardingState.provider,
      }}
    />
  );
}
