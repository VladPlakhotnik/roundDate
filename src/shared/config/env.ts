import { z } from "zod";

export const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:6670"),
  DATABASE_URL: z.string().min(1),
  DATABASE_DIRECT_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url().default("http://localhost:6670"),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  FACEBOOK_CLIENT_ID: z.string().min(1).optional(),
  FACEBOOK_CLIENT_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).default("Speed Dating <hello@example.com>"),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.message}`);
  }

  return parsed.data;
}
