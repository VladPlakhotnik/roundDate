import type { Metadata } from "next";

import { LegalPage } from "@/views/legal/LegalPage";
import { legalPages } from "@/views/legal/legal-content";

export const metadata: Metadata = {
  title: "Regulamin | RoundDate",
  description: "Regulamin korzystania z RoundDate i udziału w wydarzeniach speed dating.",
};

export default function RegulaminPage() {
  return <LegalPage content={legalPages.regulamin} />;
}
