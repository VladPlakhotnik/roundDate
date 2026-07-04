import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getSession: vi.fn(),
  insertRows: [] as unknown[][],
  selectRows: [] as unknown[][],
  updateRows: [] as unknown[][],
}));

vi.mock("server-only", () => ({}));

vi.mock("@/shared/server/auth/auth", () => ({
  getAuth: () => ({
    api: {
      getSession: mocks.getSession,
    },
  }),
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: mocks.getDb,
}));

import { getProfileOnboardingState } from "./onboarding";

function createSelectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(() => chain),
    limit: vi.fn(async () => rows),
    where: vi.fn(() => chain),
    then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(rows).then(resolve, reject),
  };

  return chain;
}

function createInsertChain(rows: unknown[]) {
  return {
    values: vi.fn(() => ({
      onConflictDoNothing: vi.fn(() => ({
        returning: vi.fn(async () => rows),
      })),
    })),
  };
}

function createUpdateChain(rows: unknown[]) {
  return {
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => rows),
      })),
    })),
  };
}

function createDb() {
  return {
    insert: vi.fn(() => createInsertChain(mocks.insertRows.shift() ?? [])),
    select: vi.fn(() => createSelectChain(mocks.selectRows.shift() ?? [])),
    update: vi.fn(() => createUpdateChain(mocks.updateRows.shift() ?? [])),
  };
}

function createProfileRow(overrides: Record<string, unknown> = {}) {
  return {
    birthDate: null,
    discoverySource: null,
    emailNotifications: true,
    eventCriteriaNotifications: true,
    eventReminderNotifications: true,
    eventResultNotifications: true,
    firstName: "Anna",
    gender: null,
    interestedIn: null,
    lastName: null,
    locale: "pl",
    marketingConsent: false,
    newDateNotifications: true,
    onboardingCompletedAt: null,
    onboardingStartedAt: null,
    phone: null,
    preferredDays: null,
    preferredTimes: null,
    ...overrides,
  };
}

describe("getProfileOnboardingState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertRows.length = 0;
    mocks.selectRows.length = 0;
    mocks.updateRows.length = 0;
    mocks.getDb.mockReturnValue(createDb());
    mocks.getSession.mockResolvedValue({
      user: {
        email: "anna@example.com",
        id: "user-1",
        image: null,
        name: "Anna Nowak",
        role: "user",
      },
    });
  });

  it("recovers when a concurrent request creates the profile first", async () => {
    mocks.selectRows.push(
      [],
      [createProfileRow()],
      [{ password: null, providerId: "google" }],
    );
    mocks.insertRows.push([]);

    await expect(
      getProfileOnboardingState({
        headers: new Headers(),
      }),
    ).resolves.toMatchObject({
      profile: {
        firstName: "Anna",
        locale: "pl",
      },
      provider: "google",
      shouldShowOnboarding: true,
      user: {
        email: "anna@example.com",
      },
    });
  });

  it("does not create a profile when creation is disabled", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);
    mocks.selectRows.push([]);

    await expect(
      getProfileOnboardingState({
        createIfMissing: false,
        headers: new Headers(),
      }),
    ).resolves.toBeNull();

    expect(db.insert).not.toHaveBeenCalled();
  });
});
