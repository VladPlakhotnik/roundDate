import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/admin/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: vi.fn(),
}));

import { normalizeAdminAuditLogFilters, sanitizeAuditLogMetadata } from "./audit-logs";

describe("admin audit logs", () => {
  it("normalizes list filters for backend queries", () => {
    expect(
      normalizeAdminAuditLogFilters({
        action: "event.updated",
        entity: "event",
        q: `  ${"x".repeat(160)}  `,
      }),
    ).toEqual({
      action: "event.updated",
      entity: "event",
      q: "x".repeat(120),
    });

    expect(
      normalizeAdminAuditLogFilters({
        action: "",
        entity: "",
        q: "a",
      }),
    ).toEqual({
      action: "all",
      entity: "all",
      q: "",
    });
  });

  it("removes sensitive and oversized metadata before persisting", () => {
    expect(
      sanitizeAuditLogMetadata({
        after: { title: "Updated" },
        password: "secret",
        token: "private",
        nested: {
          apiKey: "private",
          kept: "value",
        },
        long: "x".repeat(900),
      }),
    ).toEqual({
      after: { title: "Updated" },
      nested: {
        kept: "value",
      },
      long: `${"x".repeat(497)}...`,
    });
  });
});
