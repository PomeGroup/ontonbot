DROP INDEX IF EXISTS "eventt_event_uuid_idx";--> statement-breakpoint
ALTER TABLE "event_payment_info" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_payment_info" ADD COLUMN "ticket_video" text;--> statement-breakpoint
ALTER TABLE "event_payment_info" ADD COLUMN "ticket_activity_id" integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_event_uuid_idx" ON "event_payment_info" USING btree ("event_uuid");