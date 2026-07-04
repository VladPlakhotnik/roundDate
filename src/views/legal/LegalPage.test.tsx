import { render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { contactEmail, contactEmailHref } from "@/shared/config/contact";

import { LegalPage } from "./LegalPage";
import { legalPages } from "./legal-content";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

describe("LegalPage", () => {
  it("does not render the update date block and keeps email links readable", () => {
    render(<LegalPage content={legalPages.privacy} />);

    expect(screen.queryByText(/Aktualizacja/i)).not.toBeInTheDocument();

    const contactRegion = screen.getByRole("region", { name: "Napisz do RoundDate" });
    const contactLink = within(contactRegion).getByRole("link", { name: contactEmail });

    expect(contactLink).toHaveAttribute("href", contactEmailHref);
  });
});
