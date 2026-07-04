import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventDetailsCardTrigger } from "./EventDetailsCardTrigger";
import type { EventDetailsModalEvent } from "./EventDetailsModal";

const modalTriggerStore = vi.hoisted(() => ({
  triggers: [] as ReactNode[],
}));

vi.mock("./EventDetailsModal", () => ({
  EventDetailsModal: ({ trigger }: { trigger?: ReactNode }) => {
    modalTriggerStore.triggers.push(trigger);

    return <>{trigger}</>;
  },
}));

const event = {
  ageRange: "25-35",
  capacityTotal: 20,
  city: "Gdansk",
  conversationMinutes: 10,
  dateLabel: "14 июня",
  description: "Камерный вечер быстрых знакомств.",
  durationMinutes: 120,
  femaleSpotsAvailable: 4,
  highlights: ["10-минутные раунды"],
  id: "event-1",
  language: "RU/PL",
  locationLabel: "Gdansk, Oliwa",
  maleSpotsAvailable: 5,
  mapLocation: {
    center: [18.5605, 54.4104],
    cityLabel: "Gdansk",
    districtLabel: "Oliwa",
    marker: [18.5605, 54.4104],
    venueAddress: "ul. Opacka 12, Gdansk",
    venueLabel: "Garden lounge",
  },
  priceLabel: "129 PLN",
  spotsAvailable: 9,
  startsAt: "2031-06-14T17:00:00.000Z",
  statusLabel: "Места есть",
  timeLabel: "19:00",
  title: "RoundDate intro",
  venueAddress: "ul. Opacka 12, Gdansk",
  venueName: "Garden lounge",
  weekdayLabel: "суббота",
} satisfies EventDetailsModalEvent;

describe("EventDetailsCardTrigger", () => {
  beforeEach(() => {
    modalTriggerStore.triggers = [];
  });

  it("passes keyed trigger children to Radix Slot", () => {
    render(
      <EventDetailsCardTrigger ariaLabel={`Открыть детали ${event.title}`} event={event}>
        <span>{event.title}</span>
        <span>{event.priceLabel}</span>
      </EventDetailsCardTrigger>,
    );

    const trigger = modalTriggerStore.triggers[0] as ReactElement<{ children: ReactNode }>;
    const triggerChildren = Array.isArray(trigger.props.children)
      ? trigger.props.children
      : [trigger.props.children];

    expect(triggerChildren).toHaveLength(2);
    expect(triggerChildren.every((child) => typeof child === "object" && child?.key)).toBe(true);
  });
});
