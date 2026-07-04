import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminEmailTemplatesView } from "./AdminEmailTemplatesView";

describe("AdminEmailTemplatesView", () => {
  it("renders all email template previews with plain text and HTML links", () => {
    render(
      <AdminEmailTemplatesView
        emails={[
          {
            description: "Registration email.",
            id: "account-verification",
            subject: "RoundDate: potwierdz email",
            text: "Potwierdz email",
            title: "Potwierdzenie email",
          },
          {
            description: "Password recovery.",
            id: "password-reset",
            subject: "RoundDate: reset hasla",
            text: "Reset hasla",
            title: "Odzyskiwanie hasla",
          },
          {
            description: "Event reminder.",
            id: "event-reminder",
            subject: "RoundDate: przypomnienie - RoundDate 25-35",
            text: "Przypomnienie",
            title: "Przypomnienie o wydarzeniu",
          },
          {
            description: "Event result.",
            id: "event-result",
            subject: "RoundDate: wyniki - RoundDate 25-35",
            text: "Wyniki",
            title: "Wyniki wydarzenia",
          },
          {
            description: "Marketing campaign.",
            id: "new-events",
            subject: "RoundDate: nowe wydarzenia",
            text: "Dodaliśmy nowe wydarzenia RoundDate.",
            title: "Nowe wydarzenia",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Шаблоны писем" })).toBeInTheDocument();
    expect(screen.getByText("account-verification")).toBeInTheDocument();
    expect(screen.getByText("password-reset")).toBeInTheDocument();
    expect(screen.getByText("event-reminder")).toBeInTheDocument();
    expect(screen.getByText("event-result")).toBeInTheDocument();
    expect(screen.getByText("new-events")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open HTML preview for new-events" })).toHaveAttribute(
      "href",
      "/dev/emails/new-events",
    );
    expect(screen.getByText(/RoundDate: nowe wydarzenia/i)).toBeInTheDocument();
    expect(screen.getAllByText("Tekst plain-text").length).toBeGreaterThan(0);
  });
});
