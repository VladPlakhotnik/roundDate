import { describe, expect, it } from "vitest";

import { queryKeys } from "./index";

describe("queryKeys", () => {
  it("groups settings keys under a single settings root", () => {
    expect(queryKeys.settings.all).toEqual(["settings"]);
    expect(queryKeys.settings.account()).toEqual(["settings", "account"]);
    expect(queryKeys.settings.notifications()).toEqual(["settings", "notifications"]);
  });

  it("creates stable profile and event keys", () => {
    expect(queryKeys.profile.current()).toEqual(["profile", "current"]);
    expect(queryKeys.profile.bookings("upcoming")).toEqual([
      "profile",
      "bookings",
      { status: "upcoming" },
    ]);
    expect(queryKeys.events.detail("speed-dating-25-35")).toEqual([
      "events",
      "detail",
      "speed-dating-25-35",
    ]);
  });
});
