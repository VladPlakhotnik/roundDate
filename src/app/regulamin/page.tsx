import type { Metadata } from "next";

import { LegalPage } from "@/views/legal/LegalPage";
import { legalPages } from "@/views/legal/legal-content";

export const metadata: Metadata = {
  alternates: {
    canonical: "/regulamin",
  },
  description: "Regulamin korzystania z RoundDate i udziału w wydarzeniach speed dating.",
  openGraph: {
    description: "Regulamin korzystania z RoundDate i udziału w wydarzeniach speed dating.",
    title: "Regulamin",
    url: "/regulamin",
  },
  title: "Regulamin",
};

export default function RegulaminPage() {
  return <LegalPage content={legalPages.regulamin} />;
}
