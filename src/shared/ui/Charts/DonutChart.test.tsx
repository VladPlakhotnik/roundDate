import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DonutChart } from "./DonutChart";

describe("DonutChart", () => {
  it("uses local buttons for period changes instead of navigation links", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();

    render(
      <DonutChart
        activePeriod="all"
        data={[]}
        description="Sources"
        emptyLabel="No data"
        periodOptions={[
          { label: "All", value: "all" },
          { label: "Today", value: "today" },
        ]}
        title="Discovery sources"
        total={0}
        totalLabel="users"
        onPeriodChange={onPeriodChange}
      />,
    );

    expect(screen.queryByRole("link", { name: "Today" })).toBeNull();

    const todayButton = screen.getByRole("button", { name: "Today" });

    expect(todayButton).toHaveAttribute("aria-pressed", "false");

    await user.click(todayButton);

    expect(onPeriodChange).toHaveBeenCalledWith("today");
  });
});
