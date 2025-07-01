DO $$ BEGIN
 CREATE TYPE "public"."merch_notif_status" AS ENUM('waiting', 'sent', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "event_merch_prize_results" ADD COLUMN "notif_status" "merch_notif_status" DEFAULT 'waiting' NOT NULL;