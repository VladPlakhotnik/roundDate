import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  subscribeToNewsletter: vi.fn(),
}));

vi.mock("@/shared/server/newsletter/subscriptions", () => ({
  subscribeToNewsletter: mocks.subscribeToNewsletter,
}));

import { POST } from "./route";

describe("POST /api/newsletter/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribeToNewsletter.mockResolvedValue({
      email: "anna@example.com",
      firstName: "Anna",
    });
  });

  it("stores a valid waitlist newsletter subscription", async () => {
    const response = await POST(
      new Request("https://rounddate.example/api/newsletter/subscriptions", {
        body: JSON.stringify({
          age: 29,
          email: "anna@example.com",
          firstName: "Anna",
          gender: "female",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: "rounddate-locale=pl",
        },
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      subscription: {
        email: "anna@example.com",
        firstName: "Anna",
      },
    });
    expect(response.status).toBe(200);
    expect(mocks.subscribeToNewsletter).toHaveBeenCalledWith({
      age: 29,
      email: "anna@example.com",
      firstName: "Anna",
      gender: "female",
      locale: "pl",
      source: "home_waitlist",
    });
  });

  it("rejects invalid payloads", async () => {
    const response = await POST(
      new Request("https://rounddate.example/api/newsletter/subscriptions", {
        body: JSON.stringify({
          age: 12,
          email: "not-email",
          firstName: "",
          gender: "female",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.subscribeToNewsletter).not.toHaveBeenCalled();
  });
});
