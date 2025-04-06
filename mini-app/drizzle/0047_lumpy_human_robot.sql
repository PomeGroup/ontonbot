DROP INDEX IF EXISTS "token_campaign_orders_uuid_idx";--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "token_campaign_orders_uuid_idx" ON "token_campaign_orders" USING btree ("uuid");