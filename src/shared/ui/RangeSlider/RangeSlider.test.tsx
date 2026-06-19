import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RangeSlider } from "./RangeSlider";

describe("RangeSlider", () => {
  it("renders two range controls and emits normalized ranges", async () => {
    const onChange = vi.fn();

    render(
      <RangeSlider
        label="Возраст"
        max={65}
        min={18}
        onChange={onChange}
        value={{ from: 25, to: 35 }}
      />,
    );

    const from = screen.getByLabelText("Возраст от");
    const to = screen.getByLabelText("Возраст до");

    expect(from).toHaveAttribute("type", "range");
    expect(to).toHaveAttribute("type", "range");
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();

    fireEvent.change(from, { target: { value: "40" } });

    expect(onChange).toHaveBeenLastCalledWith({ from: 35, to: 40 });
  });

  it("centers native range inputs inside the visual slider track", () => {
    render(
      <RangeSlider
        label="Время"
        max={24}
        min={10}
        onChange={vi.fn()}
        value={{ from: 18, to: 21 }}
      />,
    );

    expect(screen.getByLabelText("Время от")).toHaveStyle({
      top: "50%",
      transform: "translateY(-50%)",
    });
    expect(screen.getByLabelText("Время до")).toHaveStyle({
      top: "50%",
      transform: "translateY(-50%)",
    });
  });
});
