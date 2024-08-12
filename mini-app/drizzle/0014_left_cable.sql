DO $$ BEGIN
 CREATE TYPE "event_participation_type" AS ENUM('in_person', 'online');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "participation_type" "event_participation_type" DEFAULT 'online' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_participation_type_idx" ON "events" ("participation_type");