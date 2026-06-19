import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/shared/ui/Toast";

import { ProfileView } from "./page";

const mockEvents = [
  {
    ageRange: "25-35",
    badge: "Популярное",
    capacityTotal: 32,
    city: "Gdansk",
    conversationMinutes: 10,
    currency: "PLN",
    dateLabel: "24 мая",
    description: "Тестовое мероприятие",
    durationMinutes: 120,
    highlights: [],
    id: "event-1",
    language: "RU",
    locationLabel: "Gdansk, Stare Miasto",
    priceLabel: "129 PLN",
    slug: "event-1",
    spotsAvailable: 8,
    startsAt: "2031-05-24T19:00:00.000+02:00",
    status: "published",
    statusLabel: "Идет набор",
    timeLabel: "19:00",
    title: "Speed dating intro",
    venueAddress: "Stare Miasto",
    venueName: "Hotel Almond",
    weekdayLabel: "сб",
  },
  {
    ageRange: "25-35",
    badge: "Новая дата",
    capacityTotal: 32,
    city: "Gdansk",
    conversationMinutes: 10,
    currency: "PLN",
    dateLabel: "31 мая",
    description: "Тестовое мероприятие",
    durationMinutes: 120,
    highlights: [],
    id: "event-2",
    language: "RU",
    locationLabel: "Gdansk, Oliwa",
    priceLabel: "129 PLN",
    slug: "event-2",
    spotsAvailable: 6,
    startsAt: "2031-05-31T19:00:00.000+02:00",
    status: "published",
    statusLabel: "Идет набор",
    timeLabel: "19:00",
    title: "Speed dating 25-35",
    venueAddress: "Oliwa",
    venueName: "Oliwski Ratusz Kultury",
    weekdayLabel: "сб",
  },
];

vi.mock("@/entities/events", () => ({
  getHomeEvents: vi.fn(() => Promise.resolve(mockEvents)),
}));

describe("ProfileView", () => {
  it("does not render favorite buttons on recommended event cards", async () => {
    render(<ToastProvider>{await ProfileView()}</ToastProvider>);

    expect(
      document.querySelector('button[aria-label*="избран"], button[aria-label*="Ð¸Ð·Ð±"]'),
    ).not.toBeInTheDocument();
  });
});
