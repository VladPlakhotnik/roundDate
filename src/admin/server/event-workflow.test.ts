import { describe, expect, it } from "vitest";

import {
  getEventPublishState,
  getEventRowActions,
  shouldPublishScheduledEvent,
} from "./event-workflow";

describe("admin event workflow", () => {
  it("marks draft events with a future publish date as scheduled", () => {
    const now = new Date("2026-06-21T12:00:00.000Z");

    expect(
      getEventPublishState({
        metadata: { publishAt: "2026-06-22T09:00:00.000Z" },
        status: "draft",
      }),
    ).toEqual({
      label: "Запланировано",
      publishAt: "2026-06-22T09:00:00.000Z",
      state: "scheduled",
    });
    expect(
      shouldPublishScheduledEvent({
        metadata: { publishAt: "2026-06-21T11:59:00.000Z" },
        now,
        status: "draft",
      }),
    ).toBe(true);
  });

  it("does not show publish action for already published or finished events", () => {
    expect(getEventRowActions({ status: "draft" })).toContain("publish");
    expect(getEventRowActions({ status: "published" })).not.toContain("publish");
    expect(getEventRowActions({ status: "finished" })).not.toContain("publish");
    expect(getEventRowActions({ status: "draft" })).toEqual([
      "publish",
      "details",
      "edit",
      "delete",
    ]);
  });
});
