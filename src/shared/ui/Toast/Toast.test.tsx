import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ToastProvider, useToast } from "./Toast";

function ToastDemo() {
  const toast = useToast();

  return (
    <>
      <button onClick={() => toast.success("Profil zaktualizowany")} type="button">
        success
      </button>
      <button onClick={() => toast.error("Nie udało się zapisać")} type="button">
        error
      </button>
      <button
        onClick={() => toast.warning("Sprawdź zakres", "Minimum jest większe niż maksimum")}
        type="button"
      >
        warning
      </button>
    </>
  );
}

describe("ToastProvider", () => {
  it("renders toast notifications from the hook", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "success" }));

    expect(screen.getByRole("status")).toHaveTextContent("Profil zaktualizowany");
  });

  it("renders error toasts as alerts and allows dismissing them", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "error" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się zapisać");

    await user.click(screen.getByRole("button", { name: "Zamknij powiadomienie" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("supports warning toasts and marks whether a description is present", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "warning" }));

    const toast = screen.getByRole("status");

    expect(toast).toHaveAttribute("data-type", "warning");
    expect(toast).toHaveAttribute("data-has-description", "true");
    expect(toast).toHaveTextContent("Sprawdź zakres");
    expect(toast).toHaveTextContent("Minimum jest większe niż maksimum");
  });
});
