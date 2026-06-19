import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/shared/server/db/client";
import { authUsers, profiles } from "@/shared/server/db/schema";

import { getSettingsSession, jsonError, nullableText, readJson } from "../_utils";

const namePayloadSchema = z.object({
  firstName: z.string().trim().min(1, "Введите имя.").max(80),
  lastName: z.string().trim().max(80),
});

export async function PATCH(request: Request) {
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = namePayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Проверьте имя и фамилию.");
  }

  const now = new Date();
  const firstName = parsed.data.firstName.trim();
  const lastName = parsed.data.lastName.trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ");
  const db = getDb();

  await db
    .insert(profiles)
    .values({
      firstName,
      lastName: nullableText(lastName),
      updatedAt: now,
      userId: session.user.id,
    })
    .onConflictDoUpdate({
      set: {
        firstName,
        lastName: nullableText(lastName),
        updatedAt: now,
      },
      target: profiles.userId,
    });

  await db
    .update(authUsers)
    .set({ name: displayName, updatedAt: now })
    .where(eq(authUsers.id, session.user.id));

  return NextResponse.json({
    displayName,
    firstName,
    lastName,
    ok: true,
  });
}
