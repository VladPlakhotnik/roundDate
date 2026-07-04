import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";

import { getSettingsSession, getSettingsTranslator, jsonError, readJson } from "../_utils";

const notificationsPayloadSchema = z.object({
  eventReminderNotifications: z.boolean(),
  eventResultNotifications: z.boolean(),
  eventCriteriaNotifications: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
  newDateNotifications: z.boolean().optional(),
  newEventNotifications: z.boolean().optional(),
}).superRefine((data, context) => {
  if (
    data.newEventNotifications === undefined &&
    data.marketingConsent === undefined &&
    data.newDateNotifications === undefined &&
    data.eventCriteriaNotifications === undefined
  ) {
    context.addIssue({
      code: "custom",
      path: ["newEventNotifications"],
      message: "Required",
    });
  }
}).transform((data) => {
  const newEventNotifications =
    data.newEventNotifications ??
    data.marketingConsent ??
    data.newDateNotifications ??
    data.eventCriteriaNotifications ??
    false;

  return {
    eventReminderNotifications: data.eventReminderNotifications,
    eventResultNotifications: data.eventResultNotifications,
    newEventNotifications,
  };
});

export async function PATCH(request: Request) {
  const t = getSettingsTranslator(request);
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError(t("api.common.unauthorized"), 401);
  }

  const parsed = notificationsPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(t("api.settings.invalidNotifications"));
  }

  const now = new Date();
  const data = parsed.data;
  const emailNotifications =
    data.eventReminderNotifications ||
    data.eventResultNotifications ||
    data.newEventNotifications;

  await getDb()
    .insert(profiles)
    .values({
      emailNotifications,
      eventCriteriaNotifications: data.newEventNotifications,
      eventReminderNotifications: data.eventReminderNotifications,
      eventResultNotifications: data.eventResultNotifications,
      marketingConsent: data.newEventNotifications,
      newDateNotifications: data.newEventNotifications,
      updatedAt: now,
      userId: session.user.id,
    })
    .onConflictDoUpdate({
      set: {
        emailNotifications,
        eventCriteriaNotifications: data.newEventNotifications,
        eventReminderNotifications: data.eventReminderNotifications,
        eventResultNotifications: data.eventResultNotifications,
        marketingConsent: data.newEventNotifications,
        newDateNotifications: data.newEventNotifications,
        updatedAt: now,
      },
      target: profiles.userId,
    });

  return NextResponse.json({ ok: true, preferences: data });
}
