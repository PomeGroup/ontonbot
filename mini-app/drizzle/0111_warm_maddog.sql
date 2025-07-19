DROP INDEX IF EXISTS "merch_results_notif_sent_at_idx";--> statement-breakpoint
ALTER TABLE "event_merch_prize_results" ADD COLUMN "notif_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "event_merch_prize_results" ADD COLUMN "error" text;
ALTER TYPE "merch_result_status" ADD VALUE 'awaiting_shipping';
