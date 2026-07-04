CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "first_name" text NOT NULL,
  "age" integer NOT NULL,
  "gender" text NOT NULL,
  "locale" text DEFAULT 'pl' NOT NULL,
  "source" text DEFAULT 'home_waitlist' NOT NULL,
  "marketing_consent" boolean DEFAULT true NOT NULL,
  "subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "unsubscribed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriptions_email_unique_idx" ON "newsletter_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_marketing_idx" ON "newsletter_subscriptions" USING btree ("marketing_consent","unsubscribed_at");
