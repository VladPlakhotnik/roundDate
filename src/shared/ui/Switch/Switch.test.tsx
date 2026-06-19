import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "./Switch";

describe("Switch", () => {
  it("renders a semantic switch and emits the next checked value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <Switch
        aria-label="Напоминания о мероприятиях"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    const switchControl = screen.getByRole("switch", {
      name: "Напоминания о мероприятиях",
    });

    expect(switchControl).toHaveAttribute("aria-checked", "false");

    await user.click(switchControl);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not emit changes while disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <Switch
        aria-label="Маркетинговые рассылки"
        checked
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    await user.click(screen.getByRole("switch", { name: "Маркетинговые рассылки" }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
