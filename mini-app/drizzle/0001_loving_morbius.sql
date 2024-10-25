ALTER TABLE "events"
ADD CONSTRAINT "events_event_uuid_unique" UNIQUE ("event_uuid");

CREATE TABLE IF NOT EXISTS "side_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"main_uuid" uuid NOT NULL,
	"side_uuid" uuid NOT NULL,
	CONSTRAINT "side_events_main_uuid_side_uuid_unique" UNIQUE("main_uuid","side_uuid")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "side_events" ADD CONSTRAINT "side_events_main_uuid_events_event_uuid_fk"
  FOREIGN KEY ("main_uuid") REFERENCES "public"."events"("event_uuid")
  ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "side_events" ADD CONSTRAINT "side_events_side_uuid_events_event_uuid_fk"
  FOREIGN KEY ("side_uuid") REFERENCES "public"."events"("event_uuid")
  ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
