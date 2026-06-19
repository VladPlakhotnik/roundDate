ALTER TABLE "profiles" ADD COLUMN "event_reminder_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "event_result_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "new_date_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "event_criteria_notifications" boolean DEFAULT true NOT NULL;