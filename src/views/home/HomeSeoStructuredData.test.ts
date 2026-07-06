import { describe, expect, it, vi } from "vitest";

import type { HomeEvent } from "@/entities/events";

import { buildHomeJsonLd } from "./HomeSeoStructuredData";

vi.mock("@/shared/config/contact", () => ({
  contactEmail: "hello@rounddate.pl",
}));

function createEvent(overrides: Partial<HomeEvent> = {}): HomeEvent {
  return {
    address: "Długi Targ 1, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Nowa data",
    capacityTotal: 20,
    city: "Gdańsk",
    conversationMinutes: 10,
    currency: "PLN",
    dateLabel: "24 maja",
    dateValue: "2031-05-24",
    description: "Kameralne spotkanie speed dating w Gdańsku.",
    district: "old-town",
    durationMinutes: 120,
    femaleSpotsAvailable: 5,
    highlights: [],
    id: "event-1",
    imageSrc: "/assets/home-events/chairs-date.png",
    language: "pl",
    location: [18.6533, 54.3464],
    locationLabel: "Gdańsk, Stare Miasto",
    maleSpotsAvailable: 5,
    mapLocation: {
      bearing: 0,
      center: [18.6533, 54.3464],
      cityLabel: "Gdańsk",
      districtLabel: "Stare Miasto",
      marker: [18.6533, 54.3464],
      pitch: 0,
      venueAddress: "Długi Targ 1, Gdańsk",
      venueLabel: "Hotel Almond",
      zoom: 14,
    },
    organizer: {
      email: "hello@rounddate.pl",
      firstName: "RoundDate",
      lastName: "Team",
      phone: "+48 512 345 678",
    },
    price: 129,
    priceLabel: "129 PLN",
    slug: "speed-dating-25-35-2031-05-24",
    spotsAvailable: 10,
    startsAt: "2031-05-24T17:00:00.000Z",
    status: "published",
    statusLabel: "Dostępne",
    tag: "closest",
    timeLabel: "19:00",
    title: "Speed dating 25-35",
    updatedAt: "2031-05-01T10:00:00.000Z",
    venueAddress: "Długi Targ 1, Gdańsk",
    venueName: "Hotel Almond",
    weekdayLabel: "sobota",
    ...overrides,
  };
}

describe("buildHomeJsonLd", () => {
  it("adds required Event structured data for visible home events", () => {
    const jsonLd = buildHomeJsonLd([createEvent()]);
    const graph = jsonLd["@graph"];
    const event = graph.find((item) => item["@type"] === "Event");

    expect(event).toMatchObject({
      "@type": "Event",
      endDate: "2031-05-24T19:00:00.000Z",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressCountry: "PL",
          addressLocality: "Gdańsk",
          addressRegion: "Pomorskie",
          streetAddress: "Długi Targ 1, Gdańsk",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 54.3464,
          longitude: 18.6533,
        },
        name: "Hotel Almond",
      },
      maximumAttendeeCapacity: 20,
      name: "Speed dating 25-35",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        price: 129,
        priceCurrency: "PLN",
        url: "https://rounddate.pl/wydarzenia/speed-dating-25-35-2031-05-24",
        validFrom: "2031-05-01T10:00:00.000Z",
      },
      remainingAttendeeCapacity: 10,
      startDate: "2031-05-24T17:00:00.000Z",
      typicalAgeRange: "25-35",
      url: "https://rounddate.pl/wydarzenia/speed-dating-25-35-2031-05-24",
    });
  });
});
