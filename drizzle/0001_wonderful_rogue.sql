ALTER TABLE "profiles" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "interested_in" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "discovery_source" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "preferred_days" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "preferred_times" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_skipped_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_id_unique_idx" ON "profiles" USING btree ("user_id");