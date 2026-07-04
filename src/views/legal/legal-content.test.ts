import { describe, expect, it } from "vitest";

import { contactEmail } from "@/shared/config/contact";

import { legalPages } from "./legal-content";

describe("legalPages", () => {
  it("contains realistic terms sections for offline speed dating events", () => {
    const sectionTitles = legalPages.regulamin.sections.map((section) => section.title);

    expect(sectionTitles).toEqual(
      expect.arrayContaining([
        "Udział w wydarzeniach",
        "Rezerwacje, płatności i odwołania",
        "Dopasowania i przekazywanie kontaktów",
        "Bezpieczeństwo i zasady zachowania",
      ]),
    );
    expect(legalPages.regulamin.lead).not.toMatch(/lorem/i);
    expect(legalPages.regulamin.summary).toContainEqual({ label: "Kontakt", value: contactEmail });
    expect(Object.hasOwn(legalPages.regulamin, "updatedAt")).toBe(false);
  });

  it("contains privacy sections required for account, events, newsletter and cookies", () => {
    const sectionTitles = legalPages.privacy.sections.map((section) => section.title);

    expect(sectionTitles).toEqual(
      expect.arrayContaining([
        "Administrator danych i kontakt",
        "Jakie dane przetwarzamy",
        "Cele i podstawy prawne",
        "Newsletter i zgody marketingowe",
        "Pliki cookies i podobne technologie",
        "Prawa użytkownika",
      ]),
    );
    expect(legalPages.privacy.lead).not.toMatch(/lorem/i);
    expect(legalPages.privacy.summary).toContainEqual({
      label: "Kontakt privacy",
      value: contactEmail,
    });
    expect(Object.hasOwn(legalPages.privacy, "updatedAt")).toBe(false);
  });
});
