import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/shared/ui/Toast";

import { OrganizerModal, type EventOrganizer } from "./OrganizerModal";

const organizer = {
  avatarUrl: "/assets/profile/matches/avatar-maria.png",
  email: "anna@rounddate.pl",
  firstName: "Anna",
  lastName: "Kowalska",
  phone: "+48 512 345 678",
  role: "Organizatorka RoundDate",
} satisfies EventOrganizer;

function renderOrganizerModal() {
  return render(
    <ToastProvider>
      <OrganizerModal
        eventTitle="RoundDate intro"
        organizer={organizer}
        trigger={<button type="button">Skontaktuj z organizatorem</button>}
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

    fireEvent.click(screen.getByRole("button", { name: "Skontaktuj z organizatorem" }));

    expect(screen.getByRole("dialog", { name: /Skontaktuj/i })).toBeInTheDocument();
    expect(screen.getByText("Anna Kowalska")).toBeInTheDocument();

    const phoneLink = screen.getByRole("link", { name: /Telefon/i });
    const emailLink = screen.getByRole("link", { name: /anna@rounddate\.pl/i });

    expect(phoneLink).toHaveAttribute("href", "tel:+48512345678");
    expect(emailLink).toHaveAttribute(
      "href",
      `mailto:anna@rounddate.pl?subject=${encodeURIComponent("Pytanie o wydarzenie RoundDate intro")}`,
    );
  });

  it("marks organizer contact modal for compact mobile layout", () => {
    renderOrganizerModal();

    fireEvent.click(screen.getByRole("button", { name: "Skontaktuj z organizatorem" }));

    const dialog = screen.getByRole("dialog", { name: /Skontaktuj/i });

    expect(dialog).toHaveAttribute("data-modal-layer", "nested");
    expect(
      document.querySelector('[data-modal-overlay][data-modal-layer="nested"]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId("organizer-contact-body")).toHaveAttribute(
      "data-mobile-layout",
      "compact-contact",
    );
    expect(within(dialog).getByTestId("organizer-contact-profile")).toHaveAttribute(
      "data-mobile-density",
      "compact",
    );
    expect(within(dialog).getByTestId("organizer-contact-actions")).toHaveAttribute(
      "data-mobile-sticky",
      "actions",
    );
  });

  it("copies phone and email with a success notification", async () => {
    renderOrganizerModal();

    fireEvent.click(screen.getByRole("button", { name: "Skontaktuj z organizatorem" }));
    fireEvent.click(screen.getByRole("button", { name: "Skopiuj email" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("anna@rounddate.pl");
    });
    expect(await screen.findByText("Email skopiowany.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skopiuj telefon" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("+48 512 345 678");
    });
    expect(await screen.findByText("Telefon skopiowany.")).toBeInTheDocument();
  });
});
