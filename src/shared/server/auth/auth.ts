import "server-only";

import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { after } from "next/server";

import { getDb } from "@/shared/server/db/client";
import {
  authAccounts,
  authRateLimits,
  authSessions,
  authUsers,
  authVerifications,
  profiles,
} from "@/shared/server/db/schema";
import { eq } from "drizzle-orm";
import { resolveLocale } from "@/shared/i18n/locales";
import { getRequestLocaleFromRequest } from "@/shared/i18n/server";
import { passwordSchema } from "@/shared/lib/validation/password";
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
        rateLimit: authRateLimits,
        verification: authVerifications,
      },
    }),
    trustedOrigins: getAuthTrustedOrigins(),
    account: {
      encryptOAuthTokens: true,
    },
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
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        "/change-email": { max: 3, window: 60 },
        "/delete-user": { max: 3, window: 60 },
        "/request-password-reset": { max: 5, window: 60 },
      },
    },
    advanced: {
      backgroundTasks: {
        handler: (promise) => after(() => promise),
      },
    },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        const passwordByPath: Record<string, unknown> = {
          "/change-password": context.body?.newPassword,
          "/reset-password": context.body?.newPassword,
          "/set-password": context.body?.newPassword,
          "/sign-up/email": context.body?.password,
        };
        const password = passwordByPath[context.path];

        if (password !== undefined && !passwordSchema.safeParse(password).success) {
          throw new APIError("BAD_REQUEST", {
            message: "Password does not meet the security requirements.",
          });
        }
      }),
    },
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
