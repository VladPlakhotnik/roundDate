import "server-only";

import { eq } from "drizzle-orm";

import type {
  OnboardingAuthProvider,
  OnboardingDay,
  OnboardingDiscoverySource,
  OnboardingFormData,
  OnboardingGender,
  OnboardingInterest,
  OnboardingTime,
  ProfileOnboardingState,
} from "@/entities/profile/model/onboarding";
import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import { authAccounts, profiles } from "@/shared/server/db/schema";

type ProfileRow = typeof profiles.$inferSelect;
type ProfileUserRole = ProfileOnboardingState["user"]["role"];

function resolveUserRole(role: unknown): ProfileUserRole {
  return role === "admin" || role === "manager" ? role : "user";
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeDate(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return "";
}

function resolveProvider(providerIds: string[]): OnboardingAuthProvider {
  if (providerIds.includes("google")) {
    return "google";
  }

  return "email";
}

function profileToFormData(profile: ProfileRow, fallbackName: string): OnboardingFormData {
  const fallback = splitName(fallbackName);

  return {
    birthDate: normalizeDate(profile.birthDate),
    discoverySource: (profile.discoverySource ?? "") as OnboardingDiscoverySource | "",
    emailNotifications: profile.emailNotifications,
    eventCriteriaNotifications: profile.eventCriteriaNotifications,
    eventReminderNotifications: profile.eventReminderNotifications,
    eventResultNotifications: profile.eventResultNotifications,
    firstName: profile.firstName ?? fallback.firstName,
    gender: (profile.gender ?? "") as OnboardingGender | "",
    interestedIn: (profile.interestedIn ?? "") as OnboardingInterest | "",
    lastName: profile.lastName ?? fallback.lastName,
    locale: profile.locale,
    marketingConsent: profile.marketingConsent,
    newDateNotifications: profile.newDateNotifications,
    phone: profile.phone ?? "",
    preferredDays: (profile.preferredDays ?? []) as OnboardingDay[],
    preferredTimes: (profile.preferredTimes ?? []) as OnboardingTime[],
  };
}

export async function getProfileOnboardingState(input: {
  headers: Headers;
  markStarted?: boolean;
}): Promise<ProfileOnboardingState | null> {
  const session = await getAuth().api.getSession({ headers: input.headers });

  if (!session?.user) {
    return null;
  }

  const db = getDb();
  const now = new Date();
  const user = session.user;
  const fallback = splitName(user.name ?? "");

  const [profileRow] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  let profile = profileRow;

  if (!profile) {
    const insertProfile: typeof profiles.$inferInsert = {
      firstName: fallback.firstName || null,
      lastName: fallback.lastName || null,
      userId: user.id,
    };

    if (input.markStarted) {
      insertProfile.onboardingStartedAt = now;
    }

    const [createdProfile] = await db.insert(profiles).values(insertProfile).returning();
    profile = createdProfile;
  } else if (input.markStarted && !profile.onboardingStartedAt && !profile.onboardingCompletedAt) {
    const [updatedProfile] = await db
      .update(profiles)
      .set({ onboardingStartedAt: now, updatedAt: now })
      .where(eq(profiles.userId, user.id))
      .returning();

    profile = updatedProfile ?? profile;
  }

  if (!profile) {
    return null;
  }

  const accountRows = await db
    .select({ password: authAccounts.password, providerId: authAccounts.providerId })
    .from(authAccounts)
    .where(eq(authAccounts.userId, user.id));

  const provider = resolveProvider(accountRows.map((account) => account.providerId));
  const linkedProviders: OnboardingAuthProvider[] = [
    ...(accountRows.some((account) => account.providerId === "google") ? ["google" as const] : []),
    ...(accountRows.some((account) => account.providerId === "credential" && account.password)
      ? ["email" as const]
      : []),
  ];
  const shouldShowOnboarding = !profile.onboardingCompletedAt;

  return {
    hasPassword: accountRows.some(
      (account) => account.providerId === "credential" && account.password,
    ),
    linkedProviders,
    profile: profileToFormData(profile, user.name ?? ""),
    provider,
    shouldShowOnboarding,
    user: {
      email: user.email,
      image: user.image ?? null,
      name: user.name ?? "",
      role: resolveUserRole((user as { role?: unknown }).role),
    },
  };
}
