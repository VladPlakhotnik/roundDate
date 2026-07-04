import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/shared/i18n/I18nProvider";
import type { Locale } from "@/shared/i18n/locales";
import { ToastProvider } from "@/shared/ui/Toast";

import { ProfileSettingsView } from "./settings-page";

const account = {
  displayName: "Anna Kowalska",
  email: "anna@example.com",
  emailNotifications: true,
  eventCriteriaNotifications: true,
  eventReminderNotifications: true,
  eventResultNotifications: true,
  firstName: "Anna",
  hasPassword: true,
  image: null,
  lastName: "Kowalska",
  linkedProviders: ["email" as const],
  locale: "en",
  marketingConsent: false,
  newDateNotifications: true,
  phone: "+48 512 345 678",
  preferredDays: ["fri" as const],
  preferredTimes: ["evening" as const],
  provider: "email" as const,
};

function renderSettings(locale: Locale, overrides: Partial<typeof account> = {}) {
  return render(
    <I18nProvider locale={locale}>
      <ToastProvider>
        <ProfileSettingsView account={{ ...account, ...overrides }} payments={[]} />
      </ToastProvider>
    </I18nProvider>,
  );
}

describe("ProfileSettingsView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the current interface language instead of stale account locale", () => {
    renderSettings("pl");

    expect(screen.getByRole("button", { name: "Polski" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "English" })).not.toBeInTheDocument();
  }, 15000);

  it("does not show Facebook as a connectable login provider", () => {
    renderSettings("en");

    expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
  });

  it("combines marketing notification options into one new events switch", async () => {
    const user = userEvent.setup();

    renderSettings("en");

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByText("Event reminders")).toBeInTheDocument();
    expect(screen.getByText("Event results")).toBeInTheDocument();
    expect(screen.getByText("New events")).toBeInTheDocument();
    expect(screen.queryByText("Marketing emails")).not.toBeInTheDocument();
    expect(screen.queryByText("New dates")).not.toBeInTheDocument();
    expect(screen.queryByText("New events by criteria")).not.toBeInTheDocument();
  });

  it("saves the combined new events preference through the new API payload", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderSettings("en", { marketingConsent: true });

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    await user.click(screen.getByRole("switch", { name: "Disable: New events" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      eventReminderNotifications: true,
      eventResultNotifications: true,
      newEventNotifications: false,
    });
  });
});
