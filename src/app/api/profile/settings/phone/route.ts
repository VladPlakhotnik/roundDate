import { NextResponse } from "next/server";
import { z } from "zod";

import { optionalPolishPhoneSchema } from "@/shared/lib/validation/contact";
import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";

import {
  getSettingsSession,
  getSettingsTranslator,
  jsonError,
  nullableText,
  readJson,
} from "../_utils";

const phonePayloadSchema = z.object({
  phone: optionalPolishPhoneSchema,
});

export async function PATCH(request: Request) {
  const t = getSettingsTranslator(request);
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError(t("api.common.unauthorized"), 401);
  }

  const parsed = phonePayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(t("api.settings.invalidPhone"));
  }

  const now = new Date();
  const phone = nullableText(parsed.data.phone);

  await getDb()
    .insert(profiles)
    .values({
      phone,
      updatedAt: now,
      userId: session.user.id,
    })
    .onConflictDoUpdate({
      set: {
        phone,
        updatedAt: now,
      },
      target: profiles.userId,
    });

  return NextResponse.json({ ok: true, phone: phone ?? "" });
}
