import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb } from "@/shared/server/db/client";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "@/shared/server/db/schema";
import { sendEmail } from "@/shared/server/email/send-email";
import { accountVerificationEmail, passwordResetEmail } from "@/shared/server/email/templates";

import { getAuthBaseUrl, getAuthSecret } from "./config";

function getSocialProviders() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
  const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;

  return {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
    ...(facebookClientId && facebookClientSecret
      ? {
          facebook: {
            clientId: facebookClientId,
            clientSecret: facebookClientSecret,
          },
        }
      : {}),
  };
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
    trustedOrigins: [getAuthBaseUrl()],
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
      sendResetPassword: async ({ user, url }) => {
        const template = passwordResetEmail({ resetUrl: url });

        await sendEmail({
          ...template,
          template: "password-reset",
          to: user.email,
          userId: user.id,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const template = accountVerificationEmail({
          name: user.name,
          verificationUrl: url,
        });

        await sendEmail({
          ...template,
          template: "account-verification",
          to: user.email,
          userId: user.id,
        });
      },
    },
    socialProviders: getSocialProviders(),
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  if (!auth) {
    auth = createAuth();
  }

  return auth;
}
