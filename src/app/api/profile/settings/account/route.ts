import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/shared/server/db/client";
import { authUsers } from "@/shared/server/db/schema";

import { expireAuthCookies, getSettingsSession, jsonError } from "../_utils";

export async function DELETE(request: Request) {
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  await getDb().delete(authUsers).where(eq(authUsers.id, session.user.id));

  return expireAuthCookies(NextResponse.json({ ok: true }));
}
