import type { Metadata } from "next";

import { LegalPage } from "@/views/legal/LegalPage";
import { legalPages } from "@/views/legal/legal-content";

export const metadata: Metadata = {
  title: "Polityka prywatności | RoundDate",
  description: "Informacje o przetwarzaniu danych osobowych w serwisie RoundDate.",
};

export default function PrivacyPage() {
  return <LegalPage content={legalPages.privacy} />;
}
