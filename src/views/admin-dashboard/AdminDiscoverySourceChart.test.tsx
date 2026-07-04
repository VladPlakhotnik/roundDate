import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminDiscoverySourceChart } from "./AdminDiscoverySourceChart";

describe("AdminDiscoverySourceChart", () => {
  it("removes the legacy sourcePeriod query parameter without navigation", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    window.history.pushState(null, "", "/admin?sourcePeriod=today&status=active#chart");

    render(
      <AdminDiscoverySourceChart
        description="Sources"
        emptyLabel="No data"
        initialData={[]}
        initialPeriod="all"
        initialTotal={0}
        periodOptions={[{ label: "All", value: "all" }]}
        title="Discovery sources"
        totalLabel="users"
      />,
    );

    await waitFor(() => {
      expect(window.location.search).toBe("?status=active");
    });
    expect(window.location.hash).toBe("#chart");
    expect(replaceState).toHaveBeenCalledWith(window.history.state, "", "/admin?status=active#chart");
  });
});
