import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { I18nProvider } from "@/shared/i18n/I18nProvider";

import { PasswordRequirements } from "./PasswordRequirements";

function renderRequirements(password: string) {
  return render(
    <I18nProvider locale="en">
      <PasswordRequirements password={password} />
    </I18nProvider>,
  );
}

describe("PasswordRequirements", () => {
  it("stays hidden before the user starts typing", () => {
    const { container } = renderRequirements("");

    expect(container).toBeEmptyDOMElement();
  });

  it("updates individual requirements as the password changes", () => {
    const { rerender } = renderRequirements("Round");

    expect(screen.getByText("At least one letter").closest("li")).toHaveAttribute(
      "data-valid",
      "true",
    );
    expect(screen.getByText("At least one number").closest("li")).toHaveAttribute(
      "data-valid",
      "false",
    );

    rerender(
      <I18nProvider locale="en">
        <PasswordRequirements password="RoundDate2026" />
      </I18nProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Password meets all requirements");
    expect(screen.queryByText("Password should contain:")).not.toBeInTheDocument();
  });
});
