"use client";

import { Children, type KeyboardEvent, type ReactNode } from "react";

import type { BadgeStatus } from "@/shared/ui/Badge";

import {
  EventDetailsModal,
  type BookingParticipantDefaults,
  type EventDetailsModalContext,
  type EventDetailsModalEvent,
} from "./EventDetailsModal";

type EventDetailsCardTriggerProps = {
  ariaLabel: string;
  bookingDefaults?: BookingParticipantDefaults;
  children: ReactNode;
  className?: string | undefined;
  context?: EventDetailsModalContext;
  event: EventDetailsModalEvent;
  status?: BadgeStatus | undefined;
  testId?: string | undefined;
};

export function EventDetailsCardTrigger({
  ariaLabel,
  bookingDefaults,
  children,
  className,
  context = "available",
  event,
  status,
  testId,
}: EventDetailsCardTriggerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }
  const triggerChildren = Children.toArray(children);

  return (
    <EventDetailsModal
      {...(bookingDefaults ? { bookingDefaults } : {})}
      context={context}
      event={event}
      {...(status ? { status } : {})}
      trigger={
        <article
          aria-label={ariaLabel}
          className={className}
          data-testid={testId}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {triggerChildren}
        </article>
      }
    />
  );
}
