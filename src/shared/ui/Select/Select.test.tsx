import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Select } from "./Select";

describe("Select", () => {
  it("renders a compact filter trigger", () => {
    render(
      <Select
        label="Район"
        options={[
          { label: "Любой район", value: "all" },
          { label: "Oliwa", value: "oliwa" },
        ]}
        value="all"
        variant="filter"
      />,
    );

    expect(screen.getByRole("button", { name: "Район Любой район" })).toHaveAttribute(
      "data-variant",
      "filter",
    );
  });
});
