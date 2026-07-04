import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/shared/i18n/I18nProvider";
import { ToastProvider } from "@/shared/ui/Toast";

import { AuthModal } from "./AuthModal";

const mocks = vi.hoisted(() => ({
  signInSocial: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: mocks.signInSocial,
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
      document.querySelector('img[src="/assets/auth/auth-visual-v3.png"]'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(screen.getAllByRole("heading", { name: "Create account" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Create a RoundDate account")).not.toBeInTheDocument();
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
