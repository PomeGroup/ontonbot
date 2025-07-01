DO $$ BEGIN
 CREATE TYPE "public"."merch_fulfil_method" AS ENUM('ship', 'pickup');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."merch_raffle_status" AS ENUM('draft', 'active', 'distributing', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."merch_result_status" AS ENUM('pending', 'awaiting_address', 'awaiting_pickup', 'shipped', 'delivered', 'collected', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_merch_raffle_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"merch_raffle_id" integer NOT NULL,
	"user_id" bigint NOT NULL,
	"score" integer NOT NULL,
	"rank" integer,
	"status" "merch_result_status" DEFAULT 'pending' NOT NULL,
	"full_name" text,
	"shipping_address" text,
	"phone" text,
	"tracking_number" text,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"collected_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_merch_raffles" (
	"merch_raffle_id" serial PRIMARY KEY NOT NULL,
	"merch_raffle_uuid" uuid NOT NULL,
	"raffle_id" integer NOT NULL,
	"item_name" text NOT NULL,
	"item_description" text,
	"image_url" text,
	"top_n" integer DEFAULT 1 NOT NULL,
	"fulfil_method" "merch_fulfil_method" DEFAULT 'ship' NOT NULL,
	"need_shipping" boolean DEFAULT true NOT NULL,
	"status" "merch_raffle_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_merch_raffle_results" ADD CONSTRAINT "event_merch_raffle_results_merch_raffle_id_event_merch_raffles_merch_raffle_id_fk" FOREIGN KEY ("merch_raffle_id") REFERENCES "public"."event_merch_raffles"("merch_raffle_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_merch_raffle_results" ADD CONSTRAINT "event_merch_raffle_results_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_merch_raffles" ADD CONSTRAINT "event_merch_raffles_raffle_id_event_raffles_raffle_id_fk" FOREIGN KEY ("raffle_id") REFERENCES "public"."event_raffles"("raffle_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_merch_raffle_results_unique" ON "event_merch_raffle_results" USING btree ("merch_raffle_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_merch_raffle_results_merch_idx" ON "event_merch_raffle_results" USING btree ("merch_raffle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_merch_raffle_results_status_idx" ON "event_merch_raffle_results" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_merch_raffles_uuid_unique" ON "event_merch_raffles" USING btree ("merch_raffle_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_merch_raffles_raffle_idx" ON "event_merch_raffles" USING btree ("raffle_id");