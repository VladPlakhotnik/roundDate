CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" text,
  "actor_email" text,
  "actor_name" text,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "summary" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_audit_logs_actor_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "admin_audit_logs"
      ADD CONSTRAINT "admin_audit_logs_actor_user_id_user_id_fk"
      FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_at_idx"
  ON "admin_audit_logs" USING btree ("created_at");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "admin_audit_logs_actor_user_id_idx"
  ON "admin_audit_logs" USING btree ("actor_user_id");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_idx"
  ON "admin_audit_logs" USING btree ("action");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "admin_audit_logs_entity_idx"
  ON "admin_audit_logs" USING btree ("entity_type", "entity_id");
