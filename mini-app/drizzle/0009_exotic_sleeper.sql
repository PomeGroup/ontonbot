ALTER TABLE "user_event_fields" ADD COLUMN "event_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_event_fields" ADD CONSTRAINT "user_event_fields_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

UPDATE "public"."user_event_fields" uef
SET "event_id" = (
  SELECT "event_id"
  FROM "public"."event_fields" ef
  WHERE ef."id" = uef."event_field_id"
)
WHERE uef."event_id" IS NULL;

