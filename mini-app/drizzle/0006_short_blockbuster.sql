DO $$ BEGIN
 CREATE TYPE "public"."order_types" AS ENUM('nft_mint', 'offchain_ticket', 'event_creation', 'event_capacity_increment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_types" AS ENUM('USDT', 'TON');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'POA_CREATION_FOR_ORGANIZER';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'USER_RECEIVED_POA';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'USER_ANSWER_POA';--> statement-breakpoint
ALTER TYPE "order_state" ADD VALUE 'processing';--> statement-breakpoint
ALTER TYPE "order_state" ADD VALUE 'completed';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_payment_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_uuid" uuid,
	"payment_type" "payment_types" NOT NULL,
	"price" integer NOT NULL,
	"recipient_address" text NOT NULL,
	"bought_capacity" integer NOT NULL,
	"ticket_type" "ticket_types" NOT NULL,
	"ticket_image" text,
	"collection_address" text,
	"title" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
DROP TABLE "event_tickets";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "utm" TO "utm_source";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_event_ticket_id_event_tickets_id_fk";
--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_event_ticket_id_event_tickets_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "orders_event_ticket_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_transaction_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_telegram_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_full_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_company_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_created_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_updated_at_idx";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "subtitle" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "society_hub_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "end_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "end_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total_price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "state" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "owner_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "utm_source" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "has_payment" boolean;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_type" "payment_types" NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" "order_types" NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_payment_info" ADD CONSTRAINT "event_payment_info_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_payment_info_event_uuid_index" ON "event_payment_info" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_event_uuid_idx" ON "event_payment_info" USING btree ("event_uuid");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_ticket_id_event_payment_info_id_fk" FOREIGN KEY ("event_ticket_id") REFERENCES "public"."event_payment_info"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "events_event_uuid_index" ON "events" USING btree ("event_uuid");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_event_creation" ON "orders" USING btree ("event_uuid","order_type") WHERE "orders"."order_type" = $1;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "wallet_seed_phrase";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "event_ticket_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "transaction_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "count";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "failed_reason";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "telegram";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "full_name";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "company";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "position";