import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuth: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/shared/server/auth/auth", () => ({
  getAuth: mocks.getAuth,
}));

import { requireAdmin, requireSuperAdmin } from "./require-admin";

function mockSession(role: string | null) {
  mocks.headers.mockResolvedValue(new Headers());
  mocks.getAuth.mockReturnValue({
    api: {
      getSession: vi.fn(async () => ({
        user: {
          email: "admin@example.com",
          id: "user-1",
          image: null,
          name: "Admin User",
          role,
        },
      })),
    },
  });
}

describe("admin access guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`);
    });
  });

  it("allows managers to enter the admin workspace", async () => {
    mockSession("manager");

    await expect(requireAdmin()).resolves.toMatchObject({
      id: "user-1",
      role: "manager",
    });
  });

  it("keeps regular users outside of the admin workspace", async () => {
    mockSession("user");

    await expect(requireAdmin()).rejects.toThrow("redirect:/profile");
  });

  it("allows only admins to enter super-admin sections", async () => {
    mockSession("admin");

    await expect(requireSuperAdmin()).resolves.toMatchObject({
      id: "user-1",
      role: "admin",
    });
  });

  it("redirects managers away from super-admin sections", async () => {
    mockSession("manager");

    await expect(requireSuperAdmin()).rejects.toThrow("redirect:/admin");
  });
});
