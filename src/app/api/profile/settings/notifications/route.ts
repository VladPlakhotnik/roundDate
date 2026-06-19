import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";

import { getSettingsSession, jsonError, readJson } from "../_utils";

const notificationsPayloadSchema = z.object({
  eventCriteriaNotifications: z.boolean(),
  eventReminderNotifications: z.boolean(),
  eventResultNotifications: z.boolean(),
  marketingConsent: z.boolean(),
  newDateNotifications: z.boolean(),
});

export async function PATCH(request: Request) {
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = notificationsPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError("Некорректные настройки уведомлений.");
  }

  const now = new Date();
  const data = parsed.data;

  await getDb()
    .insert(profiles)
    .values({
      emailNotifications: data.eventReminderNotifications,
      eventCriteriaNotifications: data.eventCriteriaNotifications,
      eventReminderNotifications: data.eventReminderNotifications,
      eventResultNotifications: data.eventResultNotifications,
      marketingConsent: data.marketingConsent,
      newDateNotifications: data.newDateNotifications,
      updatedAt: now,
      userId: session.user.id,
    })
    .onConflictDoUpdate({
      set: {
        emailNotifications: data.eventReminderNotifications,
        eventCriteriaNotifications: data.eventCriteriaNotifications,
        eventReminderNotifications: data.eventReminderNotifications,
        eventResultNotifications: data.eventResultNotifications,
        marketingConsent: data.marketingConsent,
        newDateNotifications: data.newDateNotifications,
        updatedAt: now,
      },
      target: profiles.userId,
    });

  return NextResponse.json({ ok: true, preferences: data });
}
