import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/shared/ui/Toast";

import { ProfileView } from "./page";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(new Map())),
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

const mockEvents = [
  {
    ageRange: "25-35",
    badge: "Popularne",
    capacityTotal: 32,
    city: "Gdansk",
    conversationMinutes: 10,
    currency: "PLN",
    dateLabel: "24 maja",
    description: "Testowe wydarzenie",
    durationMinutes: 120,
    highlights: [],
    id: "event-1",
    language: "PL",
    locationLabel: "Gdansk, Stare Miasto",
    priceLabel: "129 PLN",
    slug: "event-1",
    spotsAvailable: 8,
    startsAt: "2031-05-24T19:00:00.000+02:00",
    status: "published",
    statusLabel: "Trwa nabór",
    timeLabel: "19:00",
    title: "RoundDate intro",
    venueAddress: "Stare Miasto",
    venueName: "Hotel Almond",
    weekdayLabel: "sob.",
  },
  {
    ageRange: "25-35",
    badge: "Nowa data",
    capacityTotal: 32,
    city: "Gdansk",
    conversationMinutes: 10,
    currency: "PLN",
    dateLabel: "31 maja",
    description: "Testowe wydarzenie",
    durationMinutes: 120,
    highlights: [],
    id: "event-2",
    language: "PL",
    locationLabel: "Gdansk, Oliwa",
    priceLabel: "129 PLN",
    slug: "event-2",
    spotsAvailable: 6,
    startsAt: "2031-05-31T19:00:00.000+02:00",
    status: "published",
    statusLabel: "Trwa nabór",
    timeLabel: "19:00",
    title: "RoundDate 25-35",
    venueAddress: "Oliwa",
    venueName: "Oliwski Ratusz Kultury",
    weekdayLabel: "sob.",
  },
];

const profileViewEventTriggerStore = vi.hoisted(() => ({
  children: [] as ReactNode[],
}));

vi.mock("@/entities/event", () => ({
  EventDetailsCardTrigger: ({ children }: { children: ReactNode }) => {
    profileViewEventTriggerStore.children.push(children);

    return <article>{children}</article>;
  },
  EventDetailsModal: ({ trigger }: { trigger?: ReactNode }) => <>{trigger}</>,
  EventGenderAvailability: () => <span data-testid="event-gender-availability" />,
  OrganizerModal: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
}));

vi.mock("@/entities/events", () => ({
  getHomeEvents: vi.fn(() => Promise.resolve(mockEvents)),
  getUserBookings: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/entities/profile/server/onboarding", () => ({
  getProfileOnboardingState: vi.fn(() => Promise.resolve(null)),
}));

describe("ProfileView", () => {
  beforeEach(() => {
    profileViewEventTriggerStore.children = [];
  });

  it("does not render favorite buttons on recommended event cards", async () => {
    render(<ToastProvider>{await ProfileView()}</ToastProvider>);

    expect(
      document.querySelector('button[aria-label*="ulubion"], button[aria-label*="favorite"]'),
    ).not.toBeInTheDocument();
  });

  it("passes keyed direct children to recommended event triggers", async () => {
    render(<ToastProvider>{await ProfileView()}</ToastProvider>);

    expect(profileViewEventTriggerStore.children).toHaveLength(2);

    for (const triggerChildren of profileViewEventTriggerStore.children) {
      const childArray = Array.isArray(triggerChildren) ? triggerChildren : [triggerChildren];

      expect(childArray.every((child) => (child as ReactElement).key)).toBe(true);
    }
  });
});
