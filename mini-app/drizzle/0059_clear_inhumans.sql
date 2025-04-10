DROP INDEX IF EXISTS "last_checked_at_idx";--> statement-breakpoint
ALTER TABLE "user_wallet_balances" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_wallet_balances" ADD COLUMN "last_checked_at" timestamp NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "last_checked_at_idx" ON "user_wallet_balances" USING btree ("last_checked_at");