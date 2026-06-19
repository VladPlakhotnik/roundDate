import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getProfileOnboardingState } from "@/entities/profile/server/onboarding";
import { OnboardingFlow } from "@/features/onboarding";

export async function OnboardingView() {
  const requestHeaders = await headers();
  const onboardingState = await getProfileOnboardingState({
    headers: new Headers(requestHeaders),
    markStarted: true,
  });

  if (!onboardingState) {
    redirect("/");
  }

  if (!onboardingState.shouldShowOnboarding) {
    redirect("/profile");
  }

  return <OnboardingFlow initialState={onboardingState} />;
}
