CREATE TABLE IF NOT EXISTS "nft_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_uuid" uuid NOT NULL,
	"order_uuid" uuid NOT NULL,
	"nft_address" text NOT NULL,
	"owner" bigint,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"checked_lt" bigint
);
--> statement-breakpoint
ALTER TABLE "event_poa_results" ALTER COLUMN "user_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "event_poa_results" ALTER COLUMN "notification_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "event_registrants" ALTER COLUMN "register_info" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "event_registrants" ALTER COLUMN "register_info" SET DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "user_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "event_uuid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "trx_hash" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nft_items" ADD CONSTRAINT "nft_items_order_uuid_orders_uuid_fk" FOREIGN KEY ("order_uuid") REFERENCES "public"."orders"("uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nft_items" ADD CONSTRAINT "nft_items_owner_users_user_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nft_items_order_uuid_index" ON "nft_items" USING btree ("order_uuid");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_checks_wallet_address_index" ON "wallet_checks" USING btree ("wallet_address");