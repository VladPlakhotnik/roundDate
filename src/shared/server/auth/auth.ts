import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { getDb } from "@/shared/server/db/client";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  profiles,
} from "@/shared/server/db/schema";
import { eq } from "drizzle-orm";
import { resolveLocale } from "@/shared/i18n/locales";
import { getRequestLocaleFromRequest } from "@/shared/i18n/server";
import { createEmailIdempotencyKey, sendEmail } from "@/shared/server/email/send-email";
import { accountVerificationEmail, passwordResetEmail } from "@/shared/server/email/templates";

import { getAuthBaseUrl, getAuthSecret, getAuthTrustedOrigins } from "./config";

function getSocialProviders() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            prompt: "select_account" as const,
          },
        }
      : {}),
  };
}

async function getUserEmailLocale(userId: string, request?: Request | undefined) {
  const [profile] = await getDb()
    .select({
      locale: profiles.locale,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (profile?.locale) {
    return resolveLocale(profile.locale);
  }

  return request ? getRequestLocaleFromRequest(request) : resolveLocale(undefined);
}

function createAuth() {
  return betterAuth({
    baseURL: getAuthBaseUrl(),
    secret: getAuthSecret(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
    trustedOrigins: getAuthTrustedOrigins(),
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          input: false,
          defaultValue: "user",
        },
      },
      changeEmail: {
        enabled: true,
      },
      deleteUser: {
        enabled: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        const template = passwordResetEmail({
          locale: await getUserEmailLocale(user.id, request),
          name: user.name,
          resetUrl: url,
        });

        await sendEmail({
          ...template,
          idempotencyKey: createEmailIdempotencyKey("password-reset", url),
          template: "password-reset",
          to: user.email,
          userId: user.id,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }, request) => {
        const template = accountVerificationEmail({
          locale: await getUserEmailLocale(user.id, request),
          name: user.name,
          verificationUrl: url,
        });

        await sendEmail({
          ...template,
          idempotencyKey: createEmailIdempotencyKey("account-verification", url),
          template: "account-verification",
          to: user.email,
          userId: user.id,
        });
      },
    },
    socialProviders: getSocialProviders(),
    plugins: [
      admin({
        adminRoles: ["admin"],
        bannedUserMessage:
          "Twoje konto zostało zablokowane. Jeśli uważasz, że to błąd, napisz do wsparcia.",
        defaultRole: "user",
      }),
    ],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  if (!auth) {
    auth = createAuth();
  }

  return auth;
}
