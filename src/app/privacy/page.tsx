import type { Metadata } from "next";

import { LegalPage } from "@/views/legal/LegalPage";
import { legalPages } from "@/views/legal/legal-content";

export const metadata: Metadata = {
  alternates: {
    canonical: "/privacy",
  },
  description: "Informacje o przetwarzaniu danych osobowych w serwisie RoundDate.",
  openGraph: {
    description: "Informacje o przetwarzaniu danych osobowych w serwisie RoundDate.",
    title: "Polityka prywatności",
    url: "/privacy",
  },
  title: "Polityka prywatności",
};

export default function PrivacyPage() {
  return <LegalPage content={legalPages.privacy} />;
}
