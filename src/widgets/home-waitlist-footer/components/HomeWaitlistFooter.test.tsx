import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { contactEmail } from "@/shared/config/contact";
import { I18nProvider } from "@/shared/i18n/I18nProvider";
import { ToastProvider } from "@/shared/ui/Toast";

import { HomeWaitlistFooter } from "./HomeWaitlistFooter";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

function renderFooter() {
  render(
    <I18nProvider locale="en">
      <ToastProvider>
        <HomeWaitlistFooter />
      </ToastProvider>
    </I18nProvider>,
  );
}

describe("HomeWaitlistFooter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not repeat header navigation and keeps only the requested footer links", () => {
    renderFooter();

    const footer = screen.getByRole("contentinfo");

    expect(within(footer).queryByRole("link", { name: "How it works" })).not.toBeInTheDocument();
    expect(within(footer).queryByRole("link", { name: "Events" })).not.toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Instagram" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Facebook" })).toBeInTheDocument();
    expect(within(footer).queryByRole("link", { name: "Telegram" })).not.toBeInTheDocument();
    expect(within(footer).queryByRole("link", { name: "TikTok" })).not.toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: contactEmail })).toBeInTheDocument();
    expect(within(footer).queryByRole("link", { name: "+48 500 123 456" })).not.toBeInTheDocument();
    expect(within(footer).queryByRole("link", { name: "Gdańsk" })).not.toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Regulamin" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Privacy policy" })).toBeInTheDocument();
    expect(within(footer).queryByRole("link", { name: "Cookies" })).not.toBeInTheDocument();
  });

  it("submits the waitlist form and shows a success state", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        ok: true,
        subscription: {
          email: "anna@example.com",
          firstName: "Anna",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderFooter();

    await user.type(screen.getByLabelText("First name"), "Anna");
    await user.type(screen.getByLabelText("Email"), "Anna@Example.com");
    await user.type(screen.getByLabelText("Age"), "29");
    await user.click(screen.getByRole("button", { name: "Gender" }));
    await user.click(screen.getByRole("option", { name: "Woman" }));
    await user.click(screen.getByRole("button", { name: "Notify about new dates" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/newsletter/subscriptions",
        expect.objectContaining({
          body: JSON.stringify({
            age: 29,
            email: "Anna@Example.com",
            firstName: "Anna",
            gender: "female",
          }),
          method: "POST",
        }),
      );
    });
    expect(await screen.findByText("You are on the list")).toBeInTheDocument();
    expect(
      screen.getByText("Thank you. We will notify you when a matching evening appears."),
    ).toBeInTheDocument();
  });
});
