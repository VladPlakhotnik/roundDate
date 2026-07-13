import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventDetailsModal, type EventDetailsModalEvent } from "./EventDetailsModal";

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("@/shared/ui/Toast", () => ({
  useToast: () => toastMocks,
}));

vi.mock("./EventDetailsMap", () => ({
  EventDetailsMap: () => (
    <div aria-label="Mapa wydarzenia" role="region">
      Mapa
    </div>
  ),
}));

vi.mock("./OrganizerModal", () => {
  const DEFAULT_EVENT_ORGANIZER = {
    email: "hello@rounddate.pl",
    firstName: "Anna",
    lastName: "Kowalska",
    phone: "+48 512 345 678",
    role: "Organizator RoundDate",
  };

  return {
    DEFAULT_EVENT_ORGANIZER,
    getOrganizerName: (organizer: typeof DEFAULT_EVENT_ORGANIZER) =>
      `${organizer.firstName} ${organizer.lastName}`.trim(),
    OrganizerModal: ({ trigger }: { trigger: ReactNode }) => trigger,
  };
});

const event = {
  ageRange: "25-35",
  capacityTotal: 20,
  city: "Gdansk",
  conversationMinutes: 10,
  dateLabel: "14 czerwca",
  description: "Kameralny wieczor szybkich spotkan.",
  durationMinutes: 120,
  femaleSpotsAvailable: 4,
  highlights: [],
  id: "event-1",
  language: "PL/EN",
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
  statusLabel: "Sa miejsca",
  timeLabel: "19:00",
  title: "RoundDate intro",
  venueAddress: "ul. Opacka 12, Gdansk",
  venueName: "Garden lounge",
  weekdayLabel: "sobota",
} satisfies EventDetailsModalEvent;

const bookingDefaults = {
  email: "alisa@example.com",
  firstName: "Alisa",
  gender: "female",
  lastName: "Petrova",
  phone: "+48 500 111 222",
};

const invalidBookingDefaults = {
  ...bookingDefaults,
  email: "alisa",
  phone: "+49 500 111 222",
};

function openBookingDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Opłać udział" }));

  return screen.getByRole("dialog", { name: /Zapis na wydarzenie/i });
}

describe("EventDetailsModal booking flow", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens a two-step booking modal with participant defaults", () => {
    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    const bookingDialog = openBookingDialog();

    expect(within(bookingDialog).getByTestId("event-booking-footer")).toHaveAttribute(
      "data-layout",
      "single",
    );

    expect(within(bookingDialog).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(within(bookingDialog).getByLabelText(/Im/i)).toHaveValue("Alisa");
    expect(within(bookingDialog).getByLabelText("Nazwisko")).toHaveValue("Petrova");
    expect(within(bookingDialog).getByLabelText("Telefon")).toHaveValue("+48 500 111 222");
    expect(within(bookingDialog).getByLabelText("Email")).toHaveValue("alisa@example.com");
    expect(within(bookingDialog).getByText("Kobieta")).toBeInTheDocument();

    fireEvent.click(within(bookingDialog).getByRole("button", { name: /Przejd/i }));

    expect(within(bookingDialog).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(within(bookingDialog).getByText("129 PLN")).toBeInTheDocument();
    expect(within(bookingDialog).getByLabelText("Kod promocyjny")).toBeInTheDocument();
    expect(
      within(bookingDialog).queryByText(/Dane płatnicze wpisujesz wyłącznie/i),
    ).not.toBeInTheDocument();
  }, 15000);

  it("dims and blurs event details behind the nested booking modal", () => {
    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    const bookingDialog = openBookingDialog();

    expect(bookingDialog).toHaveAttribute("data-modal-layer", "nested");
    expect(
      document.querySelector('[data-modal-overlay][data-modal-layer="nested"]'),
    ).toBeInTheDocument();
  });

  it("validates email and Polish phone before payment step", () => {
    render(
      <EventDetailsModal
        bookingDefaults={invalidBookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    const bookingDialog = openBookingDialog();

    fireEvent.click(within(bookingDialog).getByRole("button", { name: /Przejd/i }));

    expect(within(bookingDialog).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(within(bookingDialog).getByText(/poprawny email/i)).toBeInTheDocument();
    expect(within(bookingDialog).getByText(/polski numer telefonu/i)).toBeInTheDocument();
    expect(within(bookingDialog).queryByText(/Koszt udzia/i)).not.toBeInTheDocument();
  });

  it("renders event details from event data without the bottom close action", () => {
    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={{
          ...event,
          highlights: ["Autorski format z API", "Balans uczestnikow z bazy"],
          language: "PL/EN",
        }}
        open
      />,
    );

    expect(screen.getByText("Autorski format z API")).toBeInTheDocument();
    expect(screen.getByText("Balans uczestnikow z bazy")).toBeInTheDocument();
    expect(screen.getByText("PL/EN")).toBeInTheDocument();
    expect(screen.getByText(/20 miejsc/i)).toBeInTheDocument();
    expect(screen.queryByText(/dla kobiet i m/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zamknij" })).not.toBeInTheDocument();
  });

  it.each([
    "attended",
    "cancelled",
    "confirmed",
    "event-ended",
    "no-show",
    "refunded",
    "waitlist",
  ] as const)("hides the payment action for booking status %s", (status) => {
    render(<EventDetailsModal context="booking" event={event} open status={status} />);

    expect(screen.queryByRole("button", { name: "Opłać udział" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Skontaktuj się z organizatorem" }),
    ).toBeInTheDocument();
  });

  it("treats a past booking as ended even when its stored payment status is pending", () => {
    render(
      <EventDetailsModal
        context="booking"
        event={{
          ...event,
          startsAt: "2026-06-14T18:00:00.000Z",
          statusLabel: "Wydarzenie zakończone",
        }}
        open
        status="payment-pending"
      />,
    );

    expect(screen.queryByRole("button", { name: "Opłać udział" })).not.toBeInTheDocument();
    expect(screen.getByTestId("event-details-summary-status")).toHaveTextContent(
      "Wydarzenie zakończone",
    );
    expect(screen.getByTestId("event-details-summary-status")).toHaveAttribute(
      "data-tone",
      "neutral",
    );
    expect(screen.getByRole("heading", { name: "Informacje o wydarzeniu" })).toBeInTheDocument();
    expect(screen.queryByText("Kobiety")).not.toBeInTheDocument();
    expect(screen.queryByText("Mężczyźni")).not.toBeInTheDocument();
  });

  it.each([
    { startsAt: "2020-01-01T17:00:00.000Z", spotsAvailable: 5 },
    { startsAt: "2031-06-14T17:00:00.000Z", spotsAvailable: 0 },
  ])("hides payment for an unavailable event", (overrides) => {
    render(<EventDetailsModal context="available" event={{ ...event, ...overrides }} open />);

    expect(screen.queryByRole("button", { name: "Opłać udział" })).not.toBeInTheDocument();
  });

  it("offers a direct retry after a failed payment", () => {
    render(<EventDetailsModal context="booking" event={event} open status="payment-failed" />);

    expect(screen.getByTestId("event-details-summary-status")).not.toHaveTextContent(
      "Płatność nieudana",
    );
    expect(screen.getByTestId("event-details-booking-status")).toHaveTextContent("Status zapisu");
    expect(screen.getByText("Płatność nieudana")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj zapłacić ponownie" }));

    const bookingDialog = screen.getByRole("dialog", { name: /Zapis na wydarzenie/i });

    expect(within(bookingDialog).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(
      within(bookingDialog).getByRole("button", { name: "Spróbuj zapłacić ponownie" }),
    ).toBeInTheDocument();
    expect(within(bookingDialog).queryByRole("button", { name: "Wstecz" })).not.toBeInTheDocument();
  });

  it("keeps event title, date, time and address in the main column", () => {
    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    const mainColumn = screen.getByTestId("event-details-main");
    const overview = within(mainColumn).getByTestId("event-details-overview");
    const overviewTitle = within(overview).getByTestId("event-details-overview-title");
    const overviewMeta = within(overview).getByTestId("event-details-overview-meta");
    const schedule = within(overview).getByTestId("event-details-overview-schedule");
    const venue = within(overview).getByTestId("event-details-overview-venue");
    const formatList = within(mainColumn).getByTestId("event-details-format-list");
    const sidebar = screen.getByTestId("event-details-summary");
    const statusLine = within(sidebar).getByTestId("event-details-summary-status");

    expect(overview).toHaveAttribute("data-density", "compact");
    expect(overviewTitle).toHaveTextContent("RoundDate intro");
    expect(overviewTitle).not.toHaveTextContent("Sa miejsca");
    expect(overviewMeta).toHaveAttribute("data-layout", "split");
    expect(schedule).toHaveTextContent(/14 czerwca 2031/i);
    expect(schedule).toHaveTextContent("19:00");
    expect(schedule).toHaveTextContent("21:00");
    expect(schedule).not.toHaveTextContent("Data");
    expect(schedule).not.toHaveTextContent("Godzina");
    expect(venue).toHaveTextContent("Garden lounge");
    expect(venue).toHaveTextContent("ul. Opacka 12, Gdansk");
    expect(within(venue).getByRole("link", { name: /Jak dojecha/i })).toBeInTheDocument();
    expect(formatList).toHaveAttribute("data-columns", "2");

    expect(sidebar).toHaveTextContent("129 PLN");
    expect(sidebar).toHaveTextContent("Anna Kowalska");
    expect(sidebar).not.toHaveTextContent("Garden lounge");
    expect(statusLine).toHaveTextContent(/miejsca/i);
    expect(statusLine).toHaveAttribute("data-tone", "success");
    expect(screen.queryByRole("heading", { name: "Parametry" })).not.toBeInTheDocument();
  });

  it("marks the details modal for a mobile-prioritized responsive layout", () => {
    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    expect(screen.getByTestId("event-details-shell")).toHaveAttribute(
      "data-mobile-layout",
      "compact-modal",
    );
    expect(screen.getByTestId("event-details-body")).toHaveAttribute(
      "data-mobile-scroll",
      "details",
    );
    expect(screen.getByTestId("event-details-summary")).toHaveAttribute(
      "data-mobile-priority",
      "primary",
    );
    expect(screen.getByTestId("event-details-main")).toHaveAttribute(
      "data-mobile-priority",
      "secondary",
    );
    expect(screen.getByTestId("event-details-footer")).toHaveAttribute(
      "data-mobile-sticky",
      "actions",
    );
    expect(screen.getByTestId("event-details-timeline")).toHaveAttribute(
      "data-line-align",
      "dot-center",
    );
  });

  it("marks the booking modal for a compact mobile flow", () => {
    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    const bookingDialog = openBookingDialog();

    expect(within(bookingDialog).getByTestId("event-booking-flow")).toHaveAttribute(
      "data-mobile-layout",
      "compact-booking",
    );
    expect(within(bookingDialog).getByTestId("event-booking-summary")).toHaveAttribute(
      "data-mobile-density",
      "compact",
    );
    expect(within(bookingDialog).getByTestId("event-booking-footer")).toHaveAttribute(
      "data-mobile-sticky",
      "actions",
    );
  });

  it("redirects to Stripe Checkout after creating a pending booking", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            booking: { bookingStatus: "pending_payment", id: "booking-1" },
            checkout: { url: "https://checkout.stripe.com/c/pay/booking-1" },
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 201,
          },
        ),
    );
    const assignMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("location", { ...window.location, assign: assignMock });

    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    const bookingDialog = openBookingDialog();

    fireEvent.click(within(bookingDialog).getByRole("button", { name: /Przejd/i }));
    fireEvent.click(within(bookingDialog).getByRole("button", { name: /Utw/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/profile/bookings",
        expect.objectContaining({
          body: JSON.stringify({ eventId: event.id }),
          method: "POST",
        }),
      );
    });
    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/booking-1");
    });
  });

  it("sends only one checkout request when the payment form is submitted twice", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const assignMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("location", { ...window.location, assign: assignMock });

    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    const bookingDialog = openBookingDialog();

    fireEvent.click(within(bookingDialog).getByRole("button", { name: /Przejd/i }));
    const bookingForm = within(bookingDialog).getByTestId("event-booking-flow");
    fireEvent.submit(bookingForm);
    fireEvent.submit(bookingForm);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch?.(
      new Response(
        JSON.stringify({
          booking: { bookingStatus: "pending_payment", id: "booking-1" },
          checkout: { url: "https://checkout.stripe.com/c/pay/booking-1" },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 201,
        },
      ),
    );

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows an inline error and a toast when the API returns no Stripe URL", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            booking: { bookingStatus: "refunded", id: "booking-1" },
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 200,
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <EventDetailsModal
        bookingDefaults={bookingDefaults}
        context="available"
        event={event}
        open
      />,
    );

    const bookingDialog = openBookingDialog();
    fireEvent.click(within(bookingDialog).getByRole("button", { name: /Przejd/i }));
    fireEvent.click(within(bookingDialog).getByRole("button", { name: /Utw/i }));

    expect(
      await within(bookingDialog).findByText(
        "Nie otrzymaliśmy linku do płatności Stripe. Spróbuj ponownie.",
      ),
    ).toBeInTheDocument();
    expect(toastMocks.error).toHaveBeenCalledWith(
      "Nie udało się przejść do płatności",
      "Nie otrzymaliśmy linku do płatności Stripe. Spróbuj ponownie.",
    );
  });
});
