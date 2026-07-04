import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  limit: vi.fn(),
  onConflictDoUpdate: vi.fn(),
  select: vi.fn(),
  returning: vi.fn(),
  values: vi.fn(),
  where: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();

  return {
    ...actual,
    and: vi.fn(() => ({ kind: "and" })),
    eq: vi.fn(() => ({ kind: "eq" })),
    isNull: vi.fn(() => ({ kind: "isNull" })),
  };
});

vi.mock("@/shared/server/db/client", () => ({
  getDb: () => ({
    insert: mocks.insert,
    select: mocks.select,
  }),
}));

import { listActiveNewsletterRecipients, subscribeToNewsletter } from "./subscriptions";

describe("newsletter subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
    mocks.onConflictDoUpdate.mockReturnValue({ returning: mocks.returning });
    mocks.returning.mockResolvedValue([
      {
        email: "anna@example.com",
        firstName: "Anna",
      },
    ]);
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ where: mocks.where });
    mocks.where.mockReturnValue({ limit: mocks.limit });
    mocks.limit.mockResolvedValue([
      {
        email: "anna@example.com",
        firstName: "Anna",
        locale: "pl",
      },
    ]);
  });

  it("upserts a normalized newsletter subscription by email", async () => {
    await expect(
      subscribeToNewsletter({
        age: 29,
        email: "  Anna@Example.COM ",
        firstName: " Anna ",
        gender: "female",
        locale: "pl",
        source: "home_waitlist",
      }),
    ).resolves.toEqual({
      email: "anna@example.com",
      firstName: "Anna",
    });

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 29,
        email: "anna@example.com",
        firstName: "Anna",
        gender: "female",
        locale: "pl",
        marketingConsent: true,
        source: "home_waitlist",
        unsubscribedAt: null,
      }),
    );
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          age: 29,
          firstName: "Anna",
          gender: "female",
          marketingConsent: true,
          unsubscribedAt: null,
        }),
      }),
    );
  });

  it("lists active opted-in recipients for a future new events campaign", async () => {
    await expect(listActiveNewsletterRecipients(500)).resolves.toEqual([
      {
        email: "anna@example.com",
        firstName: "Anna",
        locale: "pl",
      },
    ]);

    expect(mocks.limit).toHaveBeenCalledWith(500);
  });
});
