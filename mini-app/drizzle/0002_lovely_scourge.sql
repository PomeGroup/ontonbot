DO $$ BEGIN
 CREATE TYPE "order_state" AS ENUM('created', 'mint_request', 'minted', 'failed', 'validation_failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "event_ticket_status" ADD VALUE 'MINTING';--> statement-breakpoint
ALTER TYPE "event_ticket_status" ADD VALUE 'UNUSED';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_uuid" text,
	"user_id" bigint,
	"event_ticket_id" bigint NOT NULL,
	"transaction_id" text,
	"count" integer,
	"total_price" bigint,
	"state" "order_state",
	"failed_reason" text,
	"telegram" text NOT NULL,
	"full_name" text NOT NULL,
	"company" text NOT NULL,
	"position" text NOT NULL,
	"owner_address" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "event_tickets" DROP CONSTRAINT "event_tickets_event_id_events_event_id_fk";
--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_event_id_events_event_id_fk";
--> statement-breakpoint
ALTER TABLE "event_tickets" ALTER COLUMN "price" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "event_tickets" ALTER COLUMN "price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "event_ticket_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "event_tickets" ADD COLUMN "event_uuid" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "website" json;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "order_uuid" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "event_uuid" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_uuid_orders_uuid_fk" FOREIGN KEY ("order_uuid") REFERENCES "orders"("uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "event_tickets" DROP COLUMN IF EXISTS "event_id";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "event_id";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_event_ticket_id_event_tickets_id_fk" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
