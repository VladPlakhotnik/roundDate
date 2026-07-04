import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminMatchesPageData } from "@/entities/events";

import { AdminMatchesView } from "./AdminMatchesView";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/matches",
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

const matchesData: AdminMatchesPageData = {
  events: [
    {
      attendedCount: 1,
      capacityTotal: 16,
      confirmedCount: 0,
      femaleCapacity: 8,
      femaleParticipants: 1,
      id: "event-1",
      likesCount: 0,
      maleCapacity: 8,
      maleParticipants: 0,
      matchResultsPublishedAt: null,
      mutualMatchesCount: 0,
      noShowCount: 0,
      participants: [
        {
          attendeeNumber: 1,
          bookingId: "booking-1",
          email: "anna@example.com",
          eventId: "event-1",
          gender: "female",
          likesGivenToNumbers: [],
          name: "Anna Nowak",
          phone: "+48123123123",
          status: "attended",
        },
      ],
      startsAt: new Date("2031-06-14T18:00:00.000Z"),
      status: "finished",
      title: "RoundDate intro",
      totalParticipants: 1,
      venueName: "Garden lounge",
      waitlistedCount: 0,
    },
  ],
  filters: { q: "", status: "all" },
};

function renderMatchesView(data = matchesData) {
  return render(
    <AdminMatchesView
      data={data}
      publishMatchesAction={vi.fn(async () => undefined)}
      saveMatchesAction={vi.fn(async () => undefined)}
    />,
  );
}

function getPublishedMatchesData(): AdminMatchesPageData {
  return {
    ...matchesData,
    events: [
      {
        ...matchesData.events[0]!,
        matchResultsPublishedAt: "2026-07-02T10:15:00.000Z",
      },
    ],
  };
}

describe("AdminMatchesView", () => {
  it("uses an icon-only configure action and shared Select for attendance", () => {
    renderMatchesView();

    const configureButton = screen.getByRole("button", {
      name: "Настроить матчи RoundDate intro",
    });

    expect(within(configureButton).queryByText("Настроить")).not.toBeInTheDocument();

    fireEvent.click(configureButton);

    const dialog = screen.getByRole("dialog", { name: "Мэтчи: RoundDate intro" });

    expect(dialog.querySelector("select")).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Пришел" })).toBeInTheDocument();
    expect(dialog.querySelector('input[name="status:booking-1"]')).toHaveValue("attended");
  });

  it("opens an in-app confirmation modal for publishing instead of browser confirm", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderMatchesView();

    expect(screen.getByText("Не опубликовано")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Опубликовать результаты"));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Опубликовать результаты" })).toBeInTheDocument();
  });

  it("shows publish in the edit modal only before results are published", () => {
    renderMatchesView();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Настроить матчи RoundDate intro",
      }),
    );

    expect(screen.getByRole("button", { name: "Опубликовать" })).toBeInTheDocument();
  });

  it("hides publish action for already published match results", () => {
    renderMatchesView(getPublishedMatchesData());

    const row = screen.getByText("RoundDate intro").closest("tr");

    expect(row).not.toBeNull();
    expect(within(row!).getByText("Опубликовано")).toBeInTheDocument();
    expect(within(row!).getAllByRole("button")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Изменить результаты RoundDate intro" }));

    expect(screen.queryByRole("button", { name: "Опубликовать" })).not.toBeInTheDocument();
  });
});
