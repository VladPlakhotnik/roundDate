import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/shared/ui/Toast";

import { OrganizerModal, type EventOrganizer } from "./OrganizerModal";

const organizer = {
  avatarUrl: "/assets/profile/matches/avatar-maria.png",
  email: "anna@speeddate.pl",
  firstName: "Anna",
  lastName: "Kowalska",
  phone: "+48 512 345 678",
  role: "Организатор SpeedDate",
} satisfies EventOrganizer;

function renderOrganizerModal() {
  return render(
    <ToastProvider>
      <OrganizerModal
        eventTitle="Speed dating intro"
        organizer={organizer}
        trigger={<button type="button">Связаться с организатором</button>}
      />
    </ToastProvider>,
  );
}

describe("OrganizerModal", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("shows organizer contact details with direct email and phone actions", () => {
    renderOrganizerModal();

    fireEvent.click(screen.getByRole("button", { name: "Связаться с организатором" }));

    expect(screen.getByRole("dialog", { name: "Связаться с организатором" })).toBeInTheDocument();
    expect(screen.getByText("Anna Kowalska")).toBeInTheDocument();

    const phoneLink = screen.getByRole("link", { name: /телефон/i });
    const emailLink = screen.getByRole("link", { name: /anna@speeddate\.pl/i });

    expect(phoneLink).toHaveAttribute("href", "tel:+48512345678");
    expect(emailLink).toHaveAttribute(
      "href",
      `mailto:anna@speeddate.pl?subject=${encodeURIComponent("Вопрос по событию Speed dating intro")}`,
    );
  });

  it("copies phone and email with a success notification", async () => {
    renderOrganizerModal();

    fireEvent.click(screen.getByRole("button", { name: "Связаться с организатором" }));
    fireEvent.click(screen.getByRole("button", { name: "Скопировать email" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("anna@speeddate.pl");
    });
    expect(await screen.findByText("Email скопирован.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Скопировать телефон" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("+48 512 345 678");
    });
    expect(await screen.findByText("Телефон скопирован.")).toBeInTheDocument();
  });
});
