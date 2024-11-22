CREATE TABLE IF NOT EXISTS "event_registrants" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_uuid" uuid,
	"user_id" bigint,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);

--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "has_registration" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "has_approval" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "capacity" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "has_waiting_list" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm" text;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "event_start_date" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "event_end_date" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registrants" ADD CONSTRAINT "event_registrants_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registrants" ADD CONSTRAINT "event_registrants_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_registrants_event_uuid_user_id_index" ON "event_registrants" USING btree ("event_uuid","user_id");