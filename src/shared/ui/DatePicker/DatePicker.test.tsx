import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "@/shared/ui/Modal";

import { DatePicker } from "./DatePicker";

describe("DatePicker", () => {
  it("supports range selection", () => {
    const onRangeChange = vi.fn();

    render(
      <DatePicker
        label="Data"
        max="2031-06-30"
        maxYear={2031}
        min="2031-06-01"
        minYear={2031}
        mode="range"
        placeholder="Dowolna data"
        rangeValue={{ from: "2031-06-08" }}
        onRangeChange={onRangeChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: /Data 8 czerwca 2031/i });

    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "12" }));

    expect(onRangeChange).toHaveBeenLastCalledWith({
      from: "2031-06-08",
      to: "2031-06-12",
    });
  });

  it("renders a compact filter trigger without changing the calendar surface", () => {
    render(
      <DatePicker
        label="Data"
        mode="range"
        placeholder="Dowolna data"
        rangeValue={{}}
        variant="filter"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Data Dowolna data" });

    expect(trigger).toHaveAttribute("data-variant", "filter");

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: /Wybierz dat/i })).toBeInTheDocument();
  });

  it("supports a custom time picker surface", () => {
    const onChange = vi.fn();

    function TimePickerHarness() {
      const [value, setValue] = useState("19:00");

      return (
        <DatePicker
          kind="time"
          label="Time"
          value={value}
          onChange={(nextValue) => {
            setValue(nextValue);
            onChange(nextValue);
          }}
        />
      );
    }

    const { container } = render(<TimePickerHarness />);

    const trigger = screen.getByRole("button", { name: "Time 19:00" });

    expect(trigger).toHaveAttribute("data-picker-kind", "time");
    expect(container.querySelector('input[type="time"]')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const hoursInput = screen.getByLabelText("Godziny") as HTMLInputElement;

    expect(screen.queryByRole("button", { name: "09:00" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "20:00" })).not.toBeInTheDocument();

    fireEvent.focus(hoursInput);

    expect(hoursInput.selectionStart).toBe(0);
    expect(hoursInput.selectionEnd).toBe(2);

    fireEvent.change(hoursInput, { target: { value: "2" } });

    expect(hoursInput).toHaveValue("2");

    fireEvent.change(hoursInput, { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("Minuty"), { target: { value: "15" } });

    expect(onChange).toHaveBeenLastCalledWith("20:15");
  });

  it("supports the date and time picker surface", () => {
    const { container } = render(
      <DatePicker kind="datetime" label="Starts" value="2031-06-08T19:00" />,
    );

    const trigger = screen.getByRole("button", { name: /Starts/ });

    expect(trigger).toHaveAttribute("data-picker-kind", "datetime");
    expect(trigger.textContent).toContain("2031");
    expect(trigger.textContent).toContain("19:00");
    expect(container.querySelector('input[type="datetime-local"]')).toHaveValue("2031-06-08T19:00");
  });

  it("keeps the time picker inside a parent dialog", () => {
    render(
      <Modal open title="Tworzenie wydarzenia">
        <DatePicker kind="time" label="Time" value="19:00" />
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Time 19:00" }));

    const parentDialog = screen.getByRole("dialog", { name: "Tworzenie wydarzenia" });

    expect(
      within(parentDialog).getByRole("dialog", { name: /Wybierz godzin/i }),
    ).toBeInTheDocument();
  });
});
