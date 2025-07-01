DO $$ BEGIN
 CREATE TYPE "public"."raffle_kind" AS ENUM('ton', 'merch');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP CONSTRAINT "event_merch_raffles_raffle_id_event_raffles_raffle_id_fk";
--> statement-breakpoint
ALTER TABLE "event_merch_raffles" ALTER COLUMN "merch_raffle_uuid" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "event_merch_raffles" ADD COLUMN "event_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "raffle_kind" "raffle_kind";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_merch_raffles" ADD CONSTRAINT "event_merch_raffles_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_merch_raffles_uuid_uq" ON "event_merch_raffles" USING btree ("merch_raffle_uuid");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_merch_raffles_event_uq" ON "event_merch_raffles" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP COLUMN IF EXISTS "raffle_id";