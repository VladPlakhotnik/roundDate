import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/shared/i18n/I18nProvider";
import { ToastProvider } from "@/shared/ui/Toast";

import { AuthModal } from "./AuthModal";

const mocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(async () => ({ error: null })),
  signInEmail: vi.fn(async () => ({ error: null as unknown | null })),
  signInSocial: vi.fn(async () => ({ error: null })),
  signUpEmail: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: mocks.requestPasswordReset,
    signIn: {
      email: mocks.signInEmail,
      social: mocks.signInSocial,
    },
    signUp: {
      email: mocks.signUpEmail,
    },
  },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const imageProps = { ...props };

    delete imageProps.fill;
    delete imageProps.priority;
    delete imageProps.sizes;

    return createElement("img", imageProps);
  },
}));

function renderAuthModal() {
  return render(
    <I18nProvider locale="en">
      <ToastProvider>
        <AuthModal trigger={<button type="button">Open auth</button>} />
      </ToastProvider>
    </I18nProvider>,
  );
}

describe("AuthModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts Google OAuth with profile callbacks", async () => {
    const user = userEvent.setup();

    renderAuthModal();

    await user.click(screen.getByRole("button", { name: "Open auth" }));

    expect(screen.queryByRole("button", { name: "Facebook" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google" }).parentElement).toHaveAttribute(
      "data-layout",
      "single",
    );

    await user.click(screen.getByRole("button", { name: "Google" }));

    expect(mocks.signInSocial).toHaveBeenCalledWith({
      callbackURL: "/profile",
      newUserCallbackURL: "/onboarding",
      provider: "google",
    });
  });

  it("keeps the native modal content overflow visible so the close button is not clipped", async () => {
    const user = userEvent.setup();

    renderAuthModal();

    await user.click(screen.getByRole("button", { name: "Open auth" }));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveStyle({ overflow: "visible" });
  });

  it("uses short auth titles and a non-scrolling modal body", async () => {
    const user = userEvent.setup();

    renderAuthModal();

    await user.click(screen.getByRole("button", { name: "Open auth" }));

    expect(screen.getAllByRole("heading", { name: "Login" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Log in to RoundDate")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-mobile-fullscreen", "true");
    expect(document.querySelector("[data-auth-modal-shell]")).toHaveAttribute("data-scroll", "off");
    expect(
      document.querySelector('img[src="/assets/auth/auth-visual-v3.webp"]'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(screen.getAllByRole("heading", { name: "Create account" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Create a RoundDate account")).not.toBeInTheDocument();
  });

  it("keeps a persistent check-email state after email registration", async () => {
    const user = userEvent.setup();

    renderAuthModal();

    await user.click(screen.getByRole("button", { name: "Open auth" }));
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("First name"), "Anna");
    await user.type(within(dialog).getByLabelText("Email"), "anna@example.com");
    await user.type(within(dialog).getByLabelText("Password"), "Password123!");
    await user.click(within(dialog).getByRole("button", { name: "Sign up" }));

    expect(await within(dialog).findByText("Account created.")).toBeInTheDocument();
    expect(within(dialog).getByText("Check your email to confirm registration.")).toBeInTheDocument();
    expect(within(dialog).getByText("anna@example.com")).toBeInTheDocument();
  });

  it("localizes the unverified email auth error", async () => {
    const user = userEvent.setup();

    mocks.signInEmail.mockResolvedValueOnce({ error: { message: "Email not verified" } });
    renderAuthModal();

    await user.click(screen.getByRole("button", { name: "Open auth" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Email"), "anna@example.com");
    await user.type(within(dialog).getByPlaceholderText("Enter password"), "Password123!");
    await user.click(within(dialog).getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Confirm your email before logging in.")).toBeInTheDocument();
  });

  it("stretches the desktop visual column to the full modal height", () => {
    const css = readFileSync(
      join(process.cwd(), "src/features/auth/components/AuthModal.module.css"),
      "utf8",
    );
    const visualBlock = css.match(/\.visual\s*{(?<body>[^}]*)}/)?.groups?.body ?? "";

    expect(css).toContain("grid-template-columns: minmax(380px, 44%) minmax(0, 1fr);");
    expect(visualBlock).toContain("align-self: stretch;");
    expect(visualBlock).toContain("height: 100%;");
    expect(visualBlock).not.toContain("aspect-ratio");
  });
});
