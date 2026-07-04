CREATE TABLE IF NOT EXISTS "email_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_by_user_id" text,
  "type" text NOT NULL,
  "status" text DEFAULT 'sending' NOT NULL,
  "subject" text NOT NULL,
  "summary" text NOT NULL,
  "event_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "recipient_count" integer DEFAULT 0 NOT NULL,
  "sent_count" integer DEFAULT 0 NOT NULL,
  "skipped_count" integer DEFAULT 0 NOT NULL,
  "failed_count" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "email_campaigns_created_by_user_id_user_id_fk"
    FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id")
    ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_campaigns_created_at_idx" ON "email_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_campaigns_type_status_idx" ON "email_campaigns" USING btree ("type","status");
