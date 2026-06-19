import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from "./DatePicker";

describe("DatePicker", () => {
  it("supports range selection", () => {
    const onRangeChange = vi.fn();

    render(
      <DatePicker
        label="Дата"
        max="2031-06-30"
        maxYear={2031}
        min="2031-06-01"
        minYear={2031}
        mode="range"
        placeholder="Любая дата"
        rangeValue={{ from: "2031-06-08" }}
        onRangeChange={onRangeChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Дата 8 июня 2031 г." })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Дата 8 июня 2031 г." }));
    fireEvent.click(screen.getByRole("button", { name: "12" }));

    expect(onRangeChange).toHaveBeenLastCalledWith({
      from: "2031-06-08",
      to: "2031-06-12",
    });
  });

  it("renders a compact filter trigger without changing the calendar surface", () => {
    render(
      <DatePicker
        label="Дата"
        mode="range"
        placeholder="Любая дата"
        rangeValue={{}}
        variant="filter"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Дата Любая дата" });

    expect(trigger).toHaveAttribute("data-variant", "filter");

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Выберите дату" })).toBeInTheDocument();
  });
});
