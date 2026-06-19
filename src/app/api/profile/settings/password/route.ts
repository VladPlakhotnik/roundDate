import { and, eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import { authAccounts } from "@/shared/server/db/schema";

import { getApiErrorMessage, getSettingsSession, jsonError, readJson } from "../_utils";

const passwordPayloadSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Минимум 8 символов."),
});

export async function POST(request: Request) {
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = passwordPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Проверьте пароль.");
  }

  const [credentialAccount] = await getDb()
    .select({ id: authAccounts.id })
    .from(authAccounts)
    .where(
      and(
        eq(authAccounts.userId, session.user.id),
        eq(authAccounts.providerId, "credential"),
        isNotNull(authAccounts.password),
      ),
    )
    .limit(1);

  try {
    if (credentialAccount) {
      if (!parsed.data.currentPassword) {
        return jsonError("Введите текущий пароль.");
      }

      await getAuth().api.changePassword({
        body: {
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
          revokeOtherSessions: false,
        },
        headers: request.headers,
      });
    } else {
      await getAuth().api.setPassword({
        body: {
          newPassword: parsed.data.newPassword,
        },
        headers: request.headers,
      });
    }
  } catch (error) {
    return jsonError(getApiErrorMessage(error));
  }

  return NextResponse.json({ hasPassword: true, ok: true });
}
