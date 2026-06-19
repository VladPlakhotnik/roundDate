import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  onboardingDayValues,
  onboardingDiscoverySourceValues,
  onboardingGenderValues,
  onboardingInterestValues,
  onboardingTimeValues,
} from "@/entities/profile/model/onboarding";
import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(""));

const onboardingPayloadSchema = z.object({
  birthDate: dateSchema,
  discoverySource: z.enum(onboardingDiscoverySourceValues).or(z.literal("")),
  emailNotifications: z.boolean(),
  eventCriteriaNotifications: z.boolean().optional(),
  eventReminderNotifications: z.boolean().optional(),
  eventResultNotifications: z.boolean().optional(),
  firstName: z.string().trim().max(80),
  gender: z.enum(onboardingGenderValues).or(z.literal("")),
  interestedIn: z.enum(onboardingInterestValues).or(z.literal("")),
  lastName: z.string().trim().max(80),
  marketingConsent: z.boolean(),
  newDateNotifications: z.boolean().optional(),
  phone: z.string().trim().max(40),
  preferredDays: z.array(z.enum(onboardingDayValues)).max(7),
  preferredTimes: z.array(z.enum(onboardingTimeValues)).max(3),
});

const dismissPayloadSchema = z.object({
  action: z.literal("dismiss"),
});

async function getSession(request: Request) {
  return getAuth().api.getSession({ headers: request.headers });
}

function nullableText(value: string) {
  const trimmed = value.trim();

  return trimmed || null;
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const session = await getSession(request);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = onboardingPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding payload" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date();
  const data = parsed.data;
  const updateValues = {
    birthDate: data.birthDate || null,
    discoverySource: data.discoverySource || null,
    emailNotifications: data.emailNotifications,
    eventCriteriaNotifications: data.eventCriteriaNotifications ?? true,
    eventReminderNotifications: data.eventReminderNotifications ?? data.emailNotifications,
    eventResultNotifications: data.eventResultNotifications ?? true,
    firstName: nullableText(data.firstName),
    gender: data.gender || null,
    interestedIn: data.interestedIn || null,
    lastName: nullableText(data.lastName),
    marketingConsent: data.marketingConsent,
    newDateNotifications: data.newDateNotifications ?? true,
    onboardingCompletedAt: now,
    onboardingSkippedAt: null,
    phone: nullableText(data.phone),
    preferredDays: data.preferredDays,
    preferredTimes: data.preferredTimes,
    updatedAt: now,
  };

  await db
    .insert(profiles)
    .values({
      ...updateValues,
      onboardingStartedAt: now,
      userId: session.user.id,
    })
    .onConflictDoUpdate({
      set: updateValues,
      target: profiles.userId,
    });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getSession(request);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = dismissPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding action" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  if (!profile) {
    await db.insert(profiles).values({
      onboardingSkippedAt: now,
      onboardingStartedAt: now,
      updatedAt: now,
      userId: session.user.id,
    });

    return NextResponse.json({ ok: true });
  }

  if (!profile.onboardingCompletedAt) {
    await db
      .update(profiles)
      .set({ onboardingSkippedAt: now, updatedAt: now })
      .where(eq(profiles.userId, session.user.id));
  }

  return NextResponse.json({ ok: true });
}
