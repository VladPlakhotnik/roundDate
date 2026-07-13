import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/shared/ui/Toast";

import { CancelBookingButton } from "./CancelBookingButton";

const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe("CancelBookingButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ cancelled: true, refunded: true }),
        ok: true,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the cancellation modal and submits a refund cancellation", async () => {
    render(
      <ToastProvider>
        <CancelBookingButton
          bookingId="booking-1"
          eventTitle="RoundDate 25-35"
          startsAt="2031-05-24T17:00:00.000Z"
        />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Anuluj/i }));

    expect(screen.getByRole("heading", { name: /Anuluj/i })).toBeInTheDocument();
    expect(screen.getByText(/24 godziny/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Potwierd/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/profile/bookings/booking-1/cancel", {
        method: "POST",
      });
    });
    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
    expect(screen.getByRole("status")).toHaveTextContent("Zwrot zosta");
  });

  it("explains and blocks cancellation inside the 24 hour window", async () => {
    const startsAt = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();

    render(
      <ToastProvider>
        <CancelBookingButton
          bookingId="booking-1"
          eventTitle="RoundDate 25-35"
          startsAt={startsAt}
        />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Anuluj/i }));

    expect(screen.getByText("Anulowanie niedostępne")).toBeInTheDocument();
    expect(screen.getByText(/24 godziny/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Potwierdź anulowanie" })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
