import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileEventsView } from "./events-page";

describe("ProfileEventsView", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders search on the left with wide filters aligned to the right", () => {
    render(<ProfileEventsView />);

    expect(screen.getByTestId("events-toolbar")).toHaveAttribute(
      "data-layout",
      "search-left-filters-right",
    );
    expect(screen.getByTestId("events-filter-bar")).toHaveAttribute("data-align", "right");
    expect(screen.getByTestId("events-filter-bar")).toHaveAttribute("data-spacing", "equal");
    expect(screen.getByTestId("events-filter-bar")).toHaveAttribute("data-size", "wide");
    expect(screen.getByTestId("events-toolbar")).toHaveAttribute("data-padding", "compact");
    expect(screen.getByTestId("events-filter-bar")).toHaveAttribute("data-separators", "rounded");
    expect(screen.getByPlaceholderText("Поиск по названию или месту")).toBeInTheDocument();
  });

  it("renders list mode by default with sort select on the left and icon-only view switch on the right", () => {
    render(<ProfileEventsView />);

    const quickActions = screen.getByTestId("events-quick-actions");
    const viewToggle = screen.getByTestId("events-view-toggle");

    expect(screen.getByRole("button", { name: "Список" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Карточки" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(quickActions).toHaveAttribute("data-layout", "tabs-left-controls-right");
    expect(within(quickActions).getByTestId("events-list-controls")).toHaveAttribute(
      "data-layout",
      "sort-left-view-right",
    );
    expect(within(quickActions).getByTestId("events-sort-select")).toBeInTheDocument();
    expect(viewToggle).toHaveAttribute("data-placement", "right");
    expect(quickActions).toContainElement(viewToggle);
    expect(viewToggle).not.toHaveTextContent("Список");
    expect(viewToggle).not.toHaveTextContent("Карточки");
    expect(screen.queryByText("Сортировка")).not.toBeInTheDocument();
    expect(screen.queryByText("Найдено 6 мероприятий")).not.toBeInTheDocument();
    const eventCards = screen.getAllByTestId("event-card");

    expect(eventCards).toHaveLength(5);
    expect(screen.queryByText("Подробнее")).not.toBeInTheDocument();
    expect(eventCards[0]).toHaveAttribute("role", "button");
    expect(eventCards[0]).toHaveAttribute("tabindex", "0");
    expect(
      document.querySelector('button[aria-label*="избран"], button[aria-label*="Ð¸Ð·Ð±"]'),
    ).not.toBeInTheDocument();
  });

  it("renders age and price as plain filter triggers with settings popovers", () => {
    render(<ProfileEventsView />);

    const ageTrigger = screen.getByRole("button", { name: "Возраст" });
    const priceTrigger = screen.getByRole("button", { name: "Цена" });

    expect(ageTrigger).toHaveAttribute("data-variant", "plain-filter");
    expect(priceTrigger).toHaveAttribute("data-variant", "plain-filter");
    expect(ageTrigger).not.toHaveTextContent("25-45");
    expect(priceTrigger).not.toHaveTextContent("100 PLN");
    expect(screen.queryByLabelText("Возраст от")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Цена от")).not.toBeInTheDocument();

    fireEvent.click(ageTrigger);

    expect(ageTrigger).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("dialog", { name: "Фильтр: Возраст" })).toBeInTheDocument();
    expect(screen.getByLabelText("Возраст от")).toHaveAttribute("type", "range");
    expect(screen.getByLabelText("Возраст до")).toHaveAttribute("type", "range");
  });

  it("opens date as a filter popover with any-date action and date picker input", () => {
    render(<ProfileEventsView />);

    const dateTrigger = screen.getByRole("button", { name: "Дата" });

    expect(dateTrigger).toHaveAttribute("data-variant", "plain-filter");

    fireEvent.click(dateTrigger);

    const dateDialog = screen.getByRole("dialog", { name: "Фильтр: Дата" });

    expect(within(dateDialog).getByRole("button", { name: "Любая дата" })).toBeInTheDocument();
    expect(within(dateDialog).getByRole("button", { name: "Дата Любая дата" })).toBeInTheDocument();
  });

  it("renders district as a plain filter trigger with a draft popover", () => {
    render(<ProfileEventsView />);

    const districtTrigger = screen.getByRole("button", { name: "Район" });

    expect(districtTrigger).toHaveAttribute("data-variant", "plain-filter");
    expect(districtTrigger).not.toHaveTextContent("Любой район");

    fireEvent.click(districtTrigger);

    const districtDialog = screen.getByRole("dialog", { name: "Фильтр: Район" });

    expect(districtTrigger).toHaveAttribute("data-active", "true");
    expect(within(districtDialog).getByRole("button", { name: "Любой район" })).toBeInTheDocument();
    expect(
      within(districtDialog).getByText("Настройки района можно будет расширить позже"),
    ).toBeInTheDocument();
  });

  it("resets filters from the delete icon", () => {
    render(<ProfileEventsView />);

    fireEvent.change(screen.getByPlaceholderText("Поиск по названию или месту"), {
      target: { value: "Oliwa" },
    });
    expect(screen.getByPlaceholderText("Поиск по названию или месту")).toHaveValue("Oliwa");

    fireEvent.click(screen.getByRole("button", { name: "Сбросить фильтры" }));

    expect(screen.getByPlaceholderText("Поиск по названию или месту")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Ближайшие" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("renders the map as a sticky panel sized to the visible cards", () => {
    render(<ProfileEventsView />);

    const map = screen.getByRole("region", { name: "Карта мероприятий" });

    expect(map).toHaveAttribute("data-map-layout", "sticky-panel");
    expect(map).toHaveAttribute("data-map-size", "cards-fit");
    expect(screen.queryByText("Мероприятия на карте")).not.toBeInTheDocument();
    expect(screen.queryByText("Ближайшие события")).not.toBeInTheDocument();
    expect(screen.queryByText("3D-окружение")).not.toBeInTheDocument();
  });

  it("filters cards by search text", () => {
    render(<ProfileEventsView />);

    fireEvent.change(screen.getByPlaceholderText("Поиск по названию или месту"), {
      target: { value: "Oliwa" },
    });

    expect(screen.getByText("Oliwski Ratusz Kultury")).toBeInTheDocument();
    expect(screen.queryByText("Restaurant&Bar Stary Spichlerz")).not.toBeInTheDocument();
  });

  it("sorts events and hides the load more button when everything is visible", async () => {
    vi.useFakeTimers();
    render(<ProfileEventsView />);

    fireEvent.click(screen.getByRole("button", { name: "По дате" }));
    fireEvent.click(screen.getByRole("option", { name: "Сначала дешевле" }));

    const cards = screen.getAllByTestId("event-card");
    expect(within(cards[0]!).getByText("109 PLN")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Показать еще мероприятия" }));
    expect(screen.getByText("Загружаем")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(550);
    });

    expect(
      screen.queryByRole("button", { name: "Показать еще мероприятия" }),
    ).not.toBeInTheDocument();
  });
});
