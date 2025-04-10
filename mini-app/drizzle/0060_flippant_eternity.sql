ALTER TYPE "campaign_type" ADD VALUE 'just_connected';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_wallet_address_idx" ON "orders" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_address_idx" ON "token_campaign_orders" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wallet_balances_wallet_address_idx" ON "user_wallet_balances" USING btree ("wallet_address");