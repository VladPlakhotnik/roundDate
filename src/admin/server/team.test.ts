import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/admin/auth/require-admin", () => ({
  requireSuperAdmin: vi.fn(),
}));
vi.mock("@/admin/server/audit-logs", () => ({
  recordAdminAuditLog: vi.fn(),
}));
vi.mock("@/shared/server/db/client", () => ({
  getDb: vi.fn(),
}));

import {
  canChangeTeamMemberRole,
  normalizeTeamInviteInput,
  normalizeTeamRole,
} from "./team";

describe("admin team helpers", () => {
  it("normalizes invite input to a safe email and team role", () => {
    expect(
      normalizeTeamInviteInput({
        email: "  MANAGER@EXAMPLE.COM  ",
        role: "manager",
      }),
    ).toEqual({
      email: "manager@example.com",
      role: "manager",
    });
  });

  it("falls back to manager for invalid team role values", () => {
    expect(normalizeTeamRole("user")).toBe("manager");
    expect(normalizeTeamRole("admin")).toBe("admin");
  });

  it("does not allow admins to demote their own account", () => {
    expect(
      canChangeTeamMemberRole({
        actorId: "admin-1",
        nextRole: "manager",
        targetId: "admin-1",
      }),
    ).toBe(false);
  });
});
