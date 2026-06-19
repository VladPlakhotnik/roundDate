import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";

import { getSettingsSession, jsonError, nullableText, readJson } from "../_utils";

const phonePayloadSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+\d\s\-()]*$/, "Некорректный номер телефона."),
});

export async function PATCH(request: Request) {
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = phonePayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Некорректный номер телефона.");
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
