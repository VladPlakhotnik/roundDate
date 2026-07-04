import { and, eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import { authAccounts } from "@/shared/server/db/schema";

import {
  getApiErrorMessage,
  getSettingsSession,
  getSettingsTranslator,
  jsonError,
  readJson,
} from "../_utils";

const passwordPayloadSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const t = getSettingsTranslator(request);
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError(t("api.common.unauthorized"), 401);
  }

  const parsed = passwordPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    const hasShortPassword = parsed.error.issues.some(
      (issue) => issue.path.includes("newPassword") && issue.code === "too_small",
    );

    return jsonError(
      hasShortPassword ? t("api.settings.passwordTooShort") : t("api.settings.invalidPassword"),
    );
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
        return jsonError(t("api.settings.currentPasswordRequired"));
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
    return jsonError(getApiErrorMessage(error, t("api.common.generic")));
  }

  return NextResponse.json({ hasPassword: true, ok: true });
}
