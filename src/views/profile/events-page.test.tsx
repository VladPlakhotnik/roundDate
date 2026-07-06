import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileEventsView } from "./events-page";

vi.setConfig({ testTimeout: 15000 });

type TestEvents = NonNullable<ComponentProps<typeof ProfileEventsView>["events"]>;

const testEvents = [
  {
    address: "ul. Chlebnicka 10/11, Gdansk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Najblizsze",
    capacityTotal: 20,
    dateLabel: "31 maja",
    dateValue: "2031-05-31",
    description: "Stylowa przestrzen w sercu Gdanska",
    district: "Stare Miasto",
    id: "stary-spichlerz",
    imageSrc: "/assets/atmosphere/conversation-03.png",
    location: [18.6533, 54.3464],
    price: 129,
    priceLabel: "129 PLN",
    spotsAvailable: 5,
    tag: "closest",
    timeLabel: "19:00",
    title: "RoundDate 25-35",
    venueName: "Restaurant&Bar Stary Spichlerz",
    weekdayLabel: "sob.",
  },
  {
    address: "ul. Opata Jacka Rybinskiego 25, Gdansk",
    ageMax: 40,
    ageMin: 30,
    ageRange: "30-40",
    badge: "Popularne",
    capacityTotal: 18,
    dateLabel: "7 czerwca",
    dateValue: "2031-06-07",
    description: "Historyczne miejsce i inspirujaca atmosfera",
    district: "Oliwa",
    id: "oliwski-ratusz",
    imageSrc: "/assets/atmosphere/gdansk-evening.png",
    location: [18.5605, 54.4104],
    price: 119,
    priceLabel: "119 PLN",
    spotsAvailable: 6,
    tag: "week",
    timeLabel: "19:00",
    title: "RoundDate 30-40",
    venueName: "Oliwski Ratusz Kultury",
    weekdayLabel: "sob.",
  },
  {
    address: "ul. Slowackiego 23, Gdansk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Nowa data",
    capacityTotal: 20,
    dateLabel: "14 czerwca",
    dateValue: "2031-06-14",
    description: "Kameralny wieczor w przytulnej przestrzeni",
    district: "Wrzeszcz",
    id: "stary-manez",
    imageSrc: "/assets/atmosphere/conversation-06.png",
    location: [18.6046, 54.381],
    price: 129,
    priceLabel: "129 PLN",
    spotsAvailable: 7,
    tag: "weekend",
    timeLabel: "19:00",
    title: "RoundDate classic",
    venueName: "Stary Manez",
    weekdayLabel: "sob.",
  },
  {
    address: "Targ Rybny 1, Gdansk",
    ageMax: 45,
    ageMin: 35,
    ageRange: "35-45",
    badge: "Ostatnie miejsca",
    capacityTotal: 18,
    dateLabel: "21 czerwca",
    dateValue: "2031-06-21",
    description: "Romantyczna klasyka i nowe znajomosci",
    district: "Stare Miasto",
    id: "hilton",
    imageSrc: "/assets/atmosphere/conversation-02.webp",
    location: [18.659, 54.352],
    price: 139,
    priceLabel: "139 PLN",
    spotsAvailable: 2,
    tag: "weekend",
    timeLabel: "19:00",
    title: "RoundDate 35-45",
    venueName: "Hilton Gdansk",
    weekdayLabel: "sob.",
  },
  {
    address: "ul. Elektrykow 1, Gdansk",
    ageMax: 32,
    ageMin: 24,
    ageRange: "24-32",
    badge: "Dzisiaj",
    capacityTotal: 16,
    dateLabel: "28 czerwca",
    dateValue: "2031-06-28",
    description: "Lekki format na pierwsze spotkanie z projektem",
    district: "Mlode Miasto",
    id: "elektrykow",
    imageSrc: "/assets/atmosphere/welcome-board.webp",
    location: [18.647, 54.361],
    price: 109,
    priceLabel: "109 PLN",
    spotsAvailable: 4,
    tag: "today",
    timeLabel: "19:00",
    title: "RoundDate intro",
    venueName: "Ulica Elektrykow",
    weekdayLabel: "niedz.",
  },
  {
    address: "ul. Doki 1, Gdansk",
    ageMax: 38,
    ageMin: 28,
    ageRange: "28-38",
    badge: "Popularne",
    capacityTotal: 18,
    dateLabel: "5 lipca",
    dateValue: "2031-07-05",
    description: "Wieczor dla osob, ktore lubia rozmowy na zywo",
    district: "Mlode Miasto",
    id: "montownia",
    imageSrc: "/assets/atmosphere/gdansk-evening.webp",
    location: [18.649, 54.36],
    price: 149,
    priceLabel: "149 PLN",
    spotsAvailable: 8,
    tag: "all",
    timeLabel: "19:00",
    title: "RoundDate live talks",
    venueName: "Montownia Food Hall",
    weekdayLabel: "sob.",
  },
] satisfies TestEvents;

function getMockedEvents(input: Parameters<typeof fetch>[0]) {
  const url = new URL(String(input), "http://localhost");
  const query = url.searchParams.get("query")?.trim().toLowerCase() ?? "";
  const tag = url.searchParams.get("tag");
  const sort = url.searchParams.get("sort");
  let events = [...testEvents];

  if (tag && tag !== "all") {
    events = events.filter((event) => event.tag === tag);
  }

  if (query) {
    events = events.filter((event) =>
      [event.title, event.venueName, event.address, event.district]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }

  if (sort === "price-asc") {
    events.sort((first, second) => first.price - second.price);
  }

  if (sort === "price-desc") {
    events.sort((first, second) => second.price - first.price);
  }

  return events;
}

function mockEventsFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      return new Response(JSON.stringify({ events: getMockedEvents(input) }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }),
  );
}

function renderEventsView() {
  return render(<ProfileEventsView events={testEvents} />);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

describe("ProfileEventsView", () => {
  beforeEach(() => {
    mockEventsFetch();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders search on the left with wide filters aligned to the right", () => {
    renderEventsView();

    expect(screen.getByTestId("events-toolbar")).toHaveAttribute(
      "data-layout",
      "search-left-filters-right",
    );
    expect(screen.getByTestId("events-filter-bar")).toHaveAttribute("data-align", "right");
    expect(screen.getByTestId("events-filter-bar")).toHaveAttribute("data-spacing", "equal");
    expect(screen.getByTestId("events-filter-bar")).toHaveAttribute("data-size", "wide");
    expect(screen.getByTestId("events-toolbar")).toHaveAttribute("data-padding", "compact");
    expect(screen.getByTestId("events-filter-bar")).toHaveAttribute("data-separators", "rounded");
    expect(screen.getByPlaceholderText("Szukaj po nazwie albo miejscu")).toBeInTheDocument();
  });

  it("renders list mode by default with sort select on the left and icon-only view switch on the right", () => {
    renderEventsView();

    const quickActions = screen.getByTestId("events-quick-actions");
    const viewToggle = screen.getByTestId("events-view-toggle");

    expect(screen.getByRole("button", { name: "Lista" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Karty" })).toHaveAttribute("aria-pressed", "false");
    expect(quickActions).toHaveAttribute("data-layout", "tabs-left-controls-right");
    expect(within(quickActions).getByTestId("events-list-controls")).toHaveAttribute(
      "data-layout",
      "sort-left-view-right",
    );
    expect(within(quickActions).getByTestId("events-sort-select")).toBeInTheDocument();
    expect(viewToggle).toHaveAttribute("data-placement", "right");
    expect(quickActions).toContainElement(viewToggle);
    expect(viewToggle).not.toHaveTextContent("Lista");
    expect(viewToggle).not.toHaveTextContent("Karty");
    expect(screen.queryByText("Sortowanie")).not.toBeInTheDocument();
    expect(screen.getByTestId("events-list")).toHaveAttribute("data-mobile-layout", "compact-list");
    const eventCards = screen.getAllByTestId("event-card");

    expect(eventCards).toHaveLength(5);
    expect(screen.queryByText(/Zobacz/i)).not.toBeInTheDocument();
    expect(eventCards[0]).toHaveAttribute("role", "button");
    expect(eventCards[0]).toHaveAttribute("tabindex", "0");
    expect(document.querySelector('button[aria-label*="ulubion"]')).not.toBeInTheDocument();
  });

  it("opens a mobile filters panel with categories, controls, and active count", () => {
    renderEventsView();

    const mobileFiltersTrigger = screen.getByTestId("events-mobile-filter-trigger");

    expect(mobileFiltersTrigger).toHaveAttribute("aria-expanded", "false");
    expect(mobileFiltersTrigger).not.toHaveAttribute("data-active", "true");

    fireEvent.click(mobileFiltersTrigger);

    const mobileFiltersPanel = screen.getByRole("dialog", { name: /Filtry wydarze/i });

    expect(mobileFiltersTrigger).toHaveAttribute("aria-expanded", "true");
    expect(within(mobileFiltersPanel).getByText("Wiek")).toBeInTheDocument();
    expect(within(mobileFiltersPanel).queryByText("Wiek uczestnika")).not.toBeInTheDocument();
    expect(within(mobileFiltersPanel).getByText("Dzielnica")).toBeInTheDocument();
    expect(within(mobileFiltersPanel).getByText("Cena")).toBeInTheDocument();
    expect(within(mobileFiltersPanel).queryByText("Koszt udzialu")).not.toBeInTheDocument();
    expect(
      within(mobileFiltersPanel).queryByRole("button", { name: "Dowolna data" }),
    ).not.toBeInTheDocument();
    expect(within(mobileFiltersPanel).getByText("Sortowanie")).toBeInTheDocument();
    expect(within(mobileFiltersPanel).getByText("Widok")).toBeInTheDocument();

    fireEvent.click(within(mobileFiltersPanel).getByRole("button", { name: "Dzisiaj" }));

    expect(mobileFiltersTrigger).toHaveAttribute("data-active", "true");
    expect(within(mobileFiltersTrigger).getByText("1")).toBeInTheDocument();
  });

  it("renders age and price as plain filter triggers with settings popovers", () => {
    renderEventsView();

    const ageTrigger = screen.getByRole("button", { name: "Wiek" });
    const priceTrigger = screen.getByRole("button", { name: "Cena" });

    expect(ageTrigger).toHaveAttribute("data-variant", "plain-filter");
    expect(priceTrigger).toHaveAttribute("data-variant", "plain-filter");
    expect(ageTrigger).not.toHaveTextContent("25-45");
    expect(priceTrigger).not.toHaveTextContent("100 PLN");
    expect(screen.queryByLabelText("Wiek od")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Cena od")).not.toBeInTheDocument();

    fireEvent.click(ageTrigger);

    expect(ageTrigger).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("dialog", { name: "Filtr: Wiek" })).toBeInTheDocument();
    expect(screen.getByLabelText("Wiek od")).toHaveAttribute("type", "range");
    expect(screen.getByLabelText("Wiek do")).toHaveAttribute("type", "range");
  });

  it("opens date as a filter popover with any-date action and date picker input", () => {
    renderEventsView();

    const dateTrigger = screen.getByRole("button", { name: "Data" });

    expect(dateTrigger).toHaveAttribute("data-variant", "plain-filter");

    fireEvent.click(dateTrigger);

    const dateDialog = screen.getByRole("dialog", { name: "Filtr: Data" });

    expect(within(dateDialog).getByRole("button", { name: "Dowolna data" })).toBeInTheDocument();
    expect(
      within(dateDialog).getByRole("button", { name: "Data Dowolna data" }),
    ).toBeInTheDocument();
  });

  it("renders district as a plain filter trigger with a draft popover", () => {
    renderEventsView();

    const districtTrigger = screen.getByRole("button", { name: "Dzielnica" });

    expect(districtTrigger).toHaveAttribute("data-variant", "plain-filter");
    expect(districtTrigger).not.toHaveTextContent("Dowolna dzielnica");

    fireEvent.click(districtTrigger);

    const districtDialog = screen.getByRole("dialog", { name: "Filtr: Dzielnica" });

    expect(districtTrigger).toHaveAttribute("data-active", "true");
    expect(
      within(districtDialog).getByRole("button", { name: "Dowolna dzielnica" }),
    ).toBeInTheDocument();
    expect(within(districtDialog).getByText(/Filtry dzielnic/i)).toBeInTheDocument();
  });

  it("resets filters from the delete icon", () => {
    renderEventsView();

    fireEvent.change(screen.getByPlaceholderText("Szukaj po nazwie albo miejscu"), {
      target: { value: "Oliwa" },
    });
    expect(screen.getByPlaceholderText("Szukaj po nazwie albo miejscu")).toHaveValue("Oliwa");

    fireEvent.click(screen.getByRole("button", { name: "Zresetuj filtry" }));

    expect(screen.getByPlaceholderText("Szukaj po nazwie albo miejscu")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Wszystkie wydarzenia" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("renders the map as a sticky panel sized to the visible cards", () => {
    renderEventsView();

    const map = screen.getByRole("region", { name: /Mapa wydarze/i });

    expect(map).toHaveAttribute("data-map-layout", "sticky-panel");
    expect(map).toHaveAttribute("data-map-size", "cards-fit");
    expect(screen.queryByText("Wydarzenia na mapie")).not.toBeInTheDocument();
    expect(screen.queryByText("Najblizsze wydarzenia")).not.toBeInTheDocument();
    expect(screen.queryByText("3D-otoczenie")).not.toBeInTheDocument();
  });

  it("filters cards by search text", async () => {
    renderEventsView();

    fireEvent.change(screen.getByPlaceholderText("Szukaj po nazwie albo miejscu"), {
      target: { value: "Oliwa" },
    });

    await act(async () => {
      await wait(420);
    });

    expect(await screen.findByText("Oliwski Ratusz Kultury")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Restaurant&Bar Stary Spichlerz")).not.toBeInTheDocument();
    });
  });

  it("sorts events and hides the load more button when everything is visible", async () => {
    renderEventsView();

    fireEvent.click(screen.getByRole("button", { name: /Wed/i }));
    fireEvent.click(screen.getByRole("option", { name: /Najpierw ta/i }));

    await waitFor(() => {
      const cards = screen.getAllByTestId("event-card");
      expect(within(cards[0]!).getByText("109 PLN")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Poka/i }));
    expect(screen.getByText(/adujemy/i)).toBeInTheDocument();

    await wait(560);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Poka/i })).not.toBeInTheDocument();
    });
  });
});
