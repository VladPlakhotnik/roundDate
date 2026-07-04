import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Select } from "./Select";

describe("Select", () => {
  it("renders a compact filter trigger", () => {
    render(
      <Select
        label="District"
        options={[
          { label: "Any district", value: "all" },
          { label: "Oliwa", value: "oliwa" },
        ]}
        value="all"
        variant="filter"
      />,
    );

    expect(screen.getByRole("button", { name: "District Any district" })).toHaveAttribute(
      "data-variant",
      "filter",
    );
  });

  it("renders the listbox inside a modal portal root when nested in a modal", () => {
    render(
      <div data-floating-popover-root data-testid="modal-root">
        <Select
          options={[
            { label: "Attended", value: "attended" },
            { label: "No show", value: "no_show" },
          ]}
          value="attended"
        />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Attended" }));

    const modalRoot = screen.getByTestId("modal-root");

    expect(within(modalRoot).getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toHaveStyle({ position: "absolute" });
  });
});
