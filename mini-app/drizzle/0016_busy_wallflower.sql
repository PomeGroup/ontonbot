ALTER TABLE "events" ADD COLUMN "moderation_message_id" bigint;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_moderation_message_id_idx" ON "events" USING btree ("moderation_message_id");