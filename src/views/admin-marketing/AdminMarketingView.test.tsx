import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminMarketingView } from "./AdminMarketingView";

describe("AdminMarketingView", () => {
  it("renders campaign audience, event selection and template link without a manual email text field", () => {
    const { container } = render(
      <AdminMarketingView
        campaignId="11111111-1111-4111-8111-111111111111"
        data={{
          audience: {
            newsletterRecipients: 7,
            profileRecipients: 12,
            totalRecipients: 19,
          },
          events: [
            {
              ageMax: 35,
              ageMin: 25,
              city: "Gdansk",
              currency: "PLN",
              id: "event-1",
              imageSrc: "/assets/home-events/chairs-date.png",
              priceGroszy: 12900,
              slug: "rounddate-25-35",
              spotsAvailable: 8,
              startsAt: new Date("2026-08-01T17:00:00.000Z"),
              title: "RoundDate 25-35",
              venueAddress: "ul. Chlebnicka 10/11",
              venueName: "Stary Spichlerz",
            },
          ],
        }}
        sendAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Рассылки" })).toBeInTheDocument();
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /RoundDate 25-35/ })).toBeInTheDocument();
    expect(container.querySelector('[data-marketing-checkbox-visual="true"]')).toBeInTheDocument();
    expect(screen.queryByLabelText("Текст письма")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Посмотреть шаблоны" })).toHaveAttribute(
      "href",
      "/admin/marketing/templates",
    );
    expect(screen.getByDisplayValue("11111111-1111-4111-8111-111111111111")).toHaveAttribute(
      "name",
      "campaignId",
    );
  });
});
