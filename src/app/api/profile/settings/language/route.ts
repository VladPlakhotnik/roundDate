import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";

import { getSettingsSession, jsonError, readJson } from "../_utils";

const languagePayloadSchema = z.object({
  locale: z.enum(["ru", "en", "pl"]),
});

export async function PATCH(request: Request) {
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = languagePayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError("Некорректный язык интерфейса.");
  }

  const now = new Date();

  await getDb()
    .insert(profiles)
    .values({
      locale: parsed.data.locale,
      updatedAt: now,
      userId: session.user.id,
    })
    .onConflictDoUpdate({
      set: {
        locale: parsed.data.locale,
        updatedAt: now,
      },
      target: profiles.userId,
    });

  return NextResponse.json({ locale: parsed.data.locale, ok: true });
}
