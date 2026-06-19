import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/shared/ui/Toast";

import { AuthModal } from "./AuthModal";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const imageProps = { ...props };

    delete imageProps.fill;
    delete imageProps.priority;
    delete imageProps.sizes;

    return createElement("img", imageProps);
  },
}));

describe("AuthModal", () => {
  it("keeps the native modal content overflow visible so the close button is not clipped", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <AuthModal trigger={<button type="button">Open auth</button>} />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open auth" }));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveStyle({ overflow: "visible" });
  });
});
