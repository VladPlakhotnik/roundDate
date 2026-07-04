import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";
import { localeCookieName, locales } from "@/shared/i18n/locales";

import { getSettingsSession, getSettingsTranslator, jsonError, readJson } from "../_utils";

const languagePayloadSchema = z.object({
  locale: z.enum(locales),
});

export async function PATCH(request: Request) {
  const t = getSettingsTranslator(request);
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError(t("api.common.unauthorized"), 401);
  }

  const parsed = languagePayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(t("api.settings.invalidLanguage"));
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

  const response = NextResponse.json({ locale: parsed.data.locale, ok: true });
  response.cookies.set(localeCookieName, parsed.data.locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
