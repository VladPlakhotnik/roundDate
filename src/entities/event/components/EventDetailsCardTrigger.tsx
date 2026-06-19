"use client";

import type { KeyboardEvent, ReactNode } from "react";

import type { BadgeStatus } from "@/shared/ui/Badge";

import {
  EventDetailsModal,
  type EventDetailsModalContext,
  type EventDetailsModalEvent,
} from "./EventDetailsModal";

type EventDetailsCardTriggerProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string | undefined;
  context?: EventDetailsModalContext;
  event: EventDetailsModalEvent;
  status?: BadgeStatus | undefined;
  testId?: string | undefined;
};

export function EventDetailsCardTrigger({
  ariaLabel,
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

  return (
    <EventDetailsModal
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
          {children}
        </article>
      }
    />
  );
}
