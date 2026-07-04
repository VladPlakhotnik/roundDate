import { render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/shared/ui/Toast";

import { ProfileBookingsView } from "./bookings-page";

vi.mock("server-only", () => ({}));

const getUserBookingsMock = vi.hoisted(() => vi.fn());
const syncCheckoutSessionForCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(new Map())),
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock("@/entities/events", () => ({
  getUserBookings: getUserBookingsMock,
}));

vi.mock("@/shared/server/payments/stripe-return", () => ({
  syncCheckoutSessionForCurrentUser: syncCheckoutSessionForCurrentUserMock,
}));

vi.mock("@/entities/event", () => ({
  EventDetailsModal: ({ trigger }: { trigger?: ReactNode }) => <>{trigger}</>,
}));

describe("ProfileBookingsView", () => {
  beforeEach(() => {
    syncCheckoutSessionForCurrentUserMock.mockResolvedValue(null);
    getUserBookingsMock.mockResolvedValue([]);
  });

  it("renders the event instructions as a visual-left notes block", async () => {
    render(await ProfileBookingsView());

    const card = screen.getByTestId("booking-instructions-card");
    const visual = within(card).getByTestId("booking-instructions-visual");
    const content = within(card).getByTestId("booking-instructions-content");
    const header = within(content).getByTestId("booking-instructions-header");
    const list = within(content).getByTestId("booking-instructions-list");
    const image = visual.querySelector("img");

    expect(card).toHaveAttribute("data-layout", "visual-left-notes-right");
    expect(visual).toHaveAttribute("data-art", "calendar");
    expect(visual).toHaveAttribute("data-decoration", "none");
    expect(image).toHaveAttribute("src", expect.stringContaining("bookings-notes.png"));
    expect(header).toContainElement(screen.getByRole("heading", { name: /Instrukcje/i }));
    expect(list).toHaveAttribute("data-columns", "4");
    expect(within(list).getAllByTestId("booking-instructions-item")).toHaveLength(4);
  });

  it("syncs paid Stripe sessions and shows a success notice", async () => {
    syncCheckoutSessionForCurrentUserMock.mockResolvedValue({ ok: true, status: "processed" });

    window.history.replaceState(null, "", "/profile/bookings?payment=success&session_id=cs_test_1");

    render(
      <ToastProvider>
        {await ProfileBookingsView({ checkoutSessionId: "cs_test_1", paymentState: "success" })}
      </ToastProvider>,
    );

    expect(syncCheckoutSessionForCurrentUserMock).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      sessionId: "cs_test_1",
    });
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Płatność potwierdzona");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Zapis został zaktualizowany.");
    expect(window.location.search).toBe("");
  });
});
