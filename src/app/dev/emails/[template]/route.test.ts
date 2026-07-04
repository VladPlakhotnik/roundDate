import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/admin/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("../email-previews", () => ({
  getPreviewEmail: () => ({
    template: {
      assets: [],
      html: "<html><body>Preview</body></html>",
    },
  }),
}));

import { GET } from "./route";

describe("email preview route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      email: "admin@example.com",
      id: "admin-1",
      image: null,
      name: "Admin",
      role: "admin",
    });
  });

  it("requires admin access before returning an email preview", async () => {
    const response = await GET(new Request("http://localhost:6670/dev/emails/new-events"), {
      params: Promise.resolve({ template: "new-events" }),
    });

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain("Preview");
  });
});
