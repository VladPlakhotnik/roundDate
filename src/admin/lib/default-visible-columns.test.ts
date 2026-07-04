import { describe, expect, it } from "vitest";

import { getDefaultVisibleAdminColumnIds } from "./default-visible-columns";

describe("getDefaultVisibleAdminColumnIds", () => {
  it("keeps all columns visible except the configured default-hidden columns", () => {
    const columns = [
      { id: "event", label: "Event" },
      { id: "price", label: "Price" },
      { id: "address", label: "Address" },
      { id: "actions", label: "Actions" },
    ] as const;

    expect(getDefaultVisibleAdminColumnIds(columns, ["price", "address"])).toEqual([
      "event",
      "actions",
    ]);
  });
});
