import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/shared/i18n/I18nProvider";
import { ToastProvider } from "@/shared/ui/Toast";

import { ResetPasswordForm } from "./ResetPasswordForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  resetPassword: vi.fn(async () => ({ error: null as unknown | null })),
  searchParams: "",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
  useSearchParams: () => new URLSearchParams(mocks.searchParams),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    resetPassword: mocks.resetPassword,
  },
}));

function renderResetPasswordForm() {
  return render(
    <I18nProvider locale="en">
      <ToastProvider>
        <ResetPasswordForm />
      </ToastProvider>
    </I18nProvider>,
  );
}

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = "";
  });

  it("shows a persistent notice and disables submit when the token is missing", () => {
    renderResetPasswordForm();

    expect(screen.getByText("Password reset token was not found.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update password" })).toBeDisabled();
  });

  it("localizes invalid token errors from the auth provider", async () => {
    const user = userEvent.setup();

    mocks.searchParams = "token=bad-token";
    mocks.resetPassword.mockResolvedValueOnce({ error: { message: "Invalid token" } });

    renderResetPasswordForm();

    await user.type(screen.getByPlaceholderText("Minimum 8 characters"), "Password123!");
    await user.type(screen.getByPlaceholderText("Enter the password again"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      await screen.findByText("The reset link is invalid or expired. Request a new link."),
    ).toBeInTheDocument();
  });
});
