DO $$ BEGIN
 CREATE TYPE "public"."merch_prize_status" AS ENUM('draft', 'active', 'distributing', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_merch_prize_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"merch_prize_id" integer NOT NULL,
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
CREATE TABLE IF NOT EXISTS "event_merch_prizes" (
	"merch_prize_id" serial PRIMARY KEY NOT NULL,
	"merch_raffle_id" integer NOT NULL,
	"item_name" text NOT NULL,
	"item_description" text,
	"image_url" text,
	"top_n" integer DEFAULT 1 NOT NULL,
	"fulfil_method" "merch_fulfil_method" DEFAULT 'ship' NOT NULL,
	"need_shipping" boolean DEFAULT true NOT NULL,
	"status" "merch_prize_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
DROP INDEX IF EXISTS "event_merch_raffles_uuid_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "event_merch_raffles_raffle_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_merch_prize_results" ADD CONSTRAINT "event_merch_prize_results_merch_prize_id_event_merch_prizes_merch_prize_id_fk" FOREIGN KEY ("merch_prize_id") REFERENCES "public"."event_merch_prizes"("merch_prize_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_merch_prize_results" ADD CONSTRAINT "event_merch_prize_results_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_merch_prizes" ADD CONSTRAINT "event_merch_prizes_merch_raffle_id_event_merch_raffles_merch_raffle_id_fk" FOREIGN KEY ("merch_raffle_id") REFERENCES "public"."event_merch_raffles"("merch_raffle_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "merch_prize_user_unique" ON "event_merch_prize_results" USING btree ("merch_prize_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merch_results_prize_idx" ON "event_merch_prize_results" USING btree ("merch_prize_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merch_prizes_raffle_idx" ON "event_merch_prizes" USING btree ("merch_raffle_id");--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP COLUMN IF EXISTS "item_name";--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP COLUMN IF EXISTS "item_description";--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP COLUMN IF EXISTS "image_url";--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP COLUMN IF EXISTS "top_n";--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP COLUMN IF EXISTS "fulfil_method";--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP COLUMN IF EXISTS "need_shipping";--> statement-breakpoint
ALTER TABLE "event_merch_raffles" DROP COLUMN IF EXISTS "status";