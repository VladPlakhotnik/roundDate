ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "attendee_number" integer;--> statement-breakpoint

WITH numbered_bookings AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "event_id" ORDER BY "created_at", "id")::integer AS "attendee_number"
  FROM "bookings"
  WHERE "attendee_number" IS NULL AND "status" <> 'waitlisted'
)
UPDATE "bookings"
SET "attendee_number" = numbered_bookings."attendee_number"
FROM numbered_bookings
WHERE "bookings"."id" = numbered_bookings."id";--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_event_attendee_number_unique_idx"
  ON "bookings" USING btree ("event_id", "attendee_number");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "event_likes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "from_booking_id" uuid NOT NULL,
  "to_booking_id" uuid NOT NULL,
  "created_by_admin_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_likes_event_id_events_id_fk'
  ) THEN
    ALTER TABLE "event_likes"
      ADD CONSTRAINT "event_likes_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_likes_from_booking_id_bookings_id_fk'
  ) THEN
    ALTER TABLE "event_likes"
      ADD CONSTRAINT "event_likes_from_booking_id_bookings_id_fk"
      FOREIGN KEY ("from_booking_id") REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_likes_to_booking_id_bookings_id_fk'
  ) THEN
    ALTER TABLE "event_likes"
      ADD CONSTRAINT "event_likes_to_booking_id_bookings_id_fk"
      FOREIGN KEY ("to_booking_id") REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_likes_created_by_admin_id_user_id_fk'
  ) THEN
    ALTER TABLE "event_likes"
      ADD CONSTRAINT "event_likes_created_by_admin_id_user_id_fk"
      FOREIGN KEY ("created_by_admin_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "event_likes_event_id_idx"
  ON "event_likes" USING btree ("event_id");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "event_likes_from_booking_id_idx"
  ON "event_likes" USING btree ("from_booking_id");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "event_likes_to_booking_id_idx"
  ON "event_likes" USING btree ("to_booking_id");--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "event_likes_pair_unique_idx"
  ON "event_likes" USING btree ("from_booking_id", "to_booking_id");
