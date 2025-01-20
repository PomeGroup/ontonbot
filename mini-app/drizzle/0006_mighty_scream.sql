DO $$ BEGIN
 CREATE TYPE "public"."coupon_definition_status" AS ENUM('active', 'inactive', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."coupon_definition_type" AS ENUM('percent', 'fixed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."coupon_item_status" AS ENUM('used', 'unused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupon_definition" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_uuid" uuid,
	"coupon_type" "coupon_definition_type" NOT NULL,
	"status" "coupon_definition_status" NOT NULL,
	"value" numeric(8, 3) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"count" integer NOT NULL,
	"used" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupon_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_uuid" uuid,
	"coupon_definition_id" integer NOT NULL,
	"code" text NOT NULL,
	"coupon_status" "coupon_item_status" DEFAULT 'unused' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupon_definition" ADD CONSTRAINT "coupon_definition_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupon_items" ADD CONSTRAINT "coupon_items_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupon_items" ADD CONSTRAINT "coupon_items_coupon_definition_id_coupon_definition_id_fk" FOREIGN KEY ("coupon_definition_id") REFERENCES "public"."coupon_definition"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_definition_event_uuid_idx" ON "coupon_definition" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_definition_count_idx" ON "coupon_definition" USING btree ("count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_definition_start_date_end_date_idx" ON "coupon_definition" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_definition_status_idx" ON "coupon_definition" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_definition_type_idx" ON "coupon_definition" USING btree ("coupon_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_definition_used_idx" ON "coupon_definition" USING btree ("used");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_items_event_uuid_idx" ON "coupon_items" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_items_code_idx" ON "coupon_items" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_items_coupon_status_idx" ON "coupon_items" USING btree ("coupon_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_items_group_id_idx" ON "coupon_items" USING btree ("coupon_definition_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_items_event_uuid_code_uq" ON "coupon_items" USING btree ("event_uuid","code");