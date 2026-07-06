import type { Metadata } from "next";

import { OnboardingView } from "@/views/onboarding/page";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Onboarding",
};

export default function OnboardingPage() {
  return <OnboardingView />;
}
