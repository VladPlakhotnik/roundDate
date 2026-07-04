import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import type { HomeEvent } from "@/entities/events";
import { I18nProvider } from "@/shared/i18n/I18nProvider";

import { HomeEvents } from "./HomeEvents";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

vi.mock("@/entities/event", () => ({
  EventGenderAvailability: () => <span data-testid="event-gender-availability" />,
}));

const baseEvent: HomeEvent = {
  address: "ul. Chlebnicka 10/11",
  ageMax: 35,
  ageMin: 25,
  ageRange: "25-35",
  badge: "Trwa nabór",
  capacityTotal: 20,
  city: "Gdańsk",
  conversationMinutes: 10,
  currency: "PLN",
  dateLabel: "24 maja",
  dateValue: "2031-05-24",
  description: "Test event",
  district: "Stare Miasto",
  durationMinutes: 120,
  femaleSpotsAvailable: 4,
  highlights: [],
  id: "event-1",
  imageSrc: "/assets/home-events/chairs-date.png",
  language: "PL/EN",
  location: [18.6533, 54.3464],
  locationLabel: "Gdańsk, Stare Miasto",
  maleSpotsAvailable: 4,
  mapLocation: {
    bearing: -18,
    center: [18.6533, 54.3464],
    cityLabel: "Gdańsk",
    districtLabel: "Stare Miasto",
    marker: [18.6533, 54.3464],
    pitch: 58,
    venueAddress: "ul. Chlebnicka 10/11",
    venueLabel: "Stary Spichlerz",
    zoom: 15.8,
  },
  organizer: {
    email: "hello@rounddate.pl",
    firstName: "Anna",
    image: null,
    lastName: "Kowalska",
    phone: "+48 500 111 222",
  },
  price: 129,
  priceLabel: "129 PLN",
  slug: "rounddate-25-35",
  spotsAvailable: 8,
  startsAt: "2031-05-24T17:00:00.000Z",
  status: "published",
  statusLabel: "Są miejsca",
  tag: "closest",
  timeLabel: "19:00",
  title: "RoundDate 25-35",
  venueAddress: "Stare Miasto",
  venueName: "Stary Spichlerz",
  weekdayLabel: "Sobota",
};

function eventWithId(id: string): HomeEvent {
  return { ...baseEvent, id, title: `RoundDate ${id}` };
}

describe("HomeEvents", () => {
  it("marks the visible card count so incomplete rows can be centered", () => {
    const { container } = render(
      <I18nProvider locale="pl">
        <HomeEvents events={[eventWithId("one"), eventWithId("two")]} isAuthenticated />
      </I18nProvider>,
    );

    const grid = container.querySelector("[data-home-events-grid]");

    expect(grid).toHaveAttribute("data-count", "2");
    expect(container.querySelectorAll("article")).toHaveLength(2);
  });
});
