import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/shared/i18n/I18nProvider";
import type { Locale } from "@/shared/i18n/locales";
import { ToastProvider } from "@/shared/ui/Toast";

import { ProfileSettingsView } from "./settings-page";

const authMocks = vi.hoisted(() => ({
  changeEmail: vi.fn(async () => ({ error: null })),
  changePassword: vi.fn(async () => ({ error: null })),
  deleteUser: vi.fn(async () => ({ error: null })),
  requestPasswordReset: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: authMocks,
}));

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
  linkedProviders: ["email"] as Array<"email" | "google">,
  locale: "en",
  marketingConsent: false,
  newDateNotifications: true,
  phone: "+48 512 345 678",
  preferredDays: ["fri" as const],
  preferredTimes: ["evening" as const],
  provider: "email" as "email" | "google",
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
    vi.clearAllMocks();
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

  it("uses a verified email link instead of setting a password directly for an OAuth account", async () => {
    const user = userEvent.setup();

    renderSettings("en", {
      hasPassword: false,
      linkedProviders: ["google"],
      provider: "google",
    });

    const passwordRow = screen.getByRole("heading", { level: 3, name: "Password" }).parentElement
      ?.parentElement;
    expect(passwordRow).not.toBeNull();
    await user.click(within(passwordRow as HTMLElement).getByRole("button", { name: "Add" }));

    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send secure link" }));

    await waitFor(() =>
      expect(authMocks.requestPasswordReset).toHaveBeenCalledWith({
        email: "anna@example.com",
        redirectTo: "/reset-password",
      }),
    );
    expect(authMocks.changePassword).not.toHaveBeenCalled();
  });

  it("blocks a no-op email change before contacting the auth service", async () => {
    const user = userEvent.setup();

    renderSettings("en");

    const emailRow = screen
      .getAllByRole("heading", { level: 3, name: "Email" })
      .map((heading) => heading.parentElement?.parentElement)
      .find(
        (row): row is HTMLElement =>
          row instanceof HTMLElement &&
          within(row).queryByRole("button", { name: "Change" }) !== null,
      );
    expect(emailRow).not.toBeNull();
    await user.click(within(emailRow as HTMLElement).getByRole("button", { name: "Change" }));
    await user.click(screen.getByRole("button", { name: "Send email" }));

    expect(
      await screen.findByText("Enter an address different from your current email."),
    ).toBeInTheDocument();
    expect(authMocks.changeEmail).not.toHaveBeenCalled();
  });

  it("explains the one-step new-email verification flow", async () => {
    const user = userEvent.setup();

    renderSettings("en");

    const emailRow = screen
      .getAllByRole("heading", { level: 3, name: "Email" })
      .map((heading) => heading.parentElement?.parentElement)
      .find(
        (row): row is HTMLElement =>
          row instanceof HTMLElement &&
          within(row).queryByRole("button", { name: "Change" }) !== null,
      );
    expect(emailRow).toBeDefined();
    await user.click(within(emailRow as HTMLElement).getByRole("button", { name: "Change" }));

    expect(
      screen.getByText(
        "We will send a verification link to the new address. Email changes after you click it.",
      ),
    ).toBeInTheDocument();
  });

  it("shows immediate deletion copy without an email confirmation step", async () => {
    const user = userEvent.setup();

    renderSettings("en");
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    expect(
      screen.getByText(
        "Your account, profile, bookings and related data will be permanently deleted. This action cannot be undone.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
    expect(screen.queryByText(/confirmation link/i)).not.toBeInTheDocument();
  });
});
