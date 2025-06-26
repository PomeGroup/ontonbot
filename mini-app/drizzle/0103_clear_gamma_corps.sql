DROP INDEX IF EXISTS "events_giveaway_wallet_address_idx";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "giveaway_wallet_address" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_giveaway_wallet_address_idx" ON "events" USING btree ("giveaway_wallet_address");