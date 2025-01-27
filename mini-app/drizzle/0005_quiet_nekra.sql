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
DO $$ BEGIN
 CREATE TYPE "public"."organizer_payment_status" AS ENUM('not_payed', 'payed_to_organizer', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_flags_enum" AS ENUM('event_moderator', 'ton_society_verified' , 'api_key');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "order_types" ADD VALUE 'promote_to_organizer';--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "user_custom_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"user_flag" "user_flags_enum" NOT NULL,
	"value" text,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "event_uuid" DROP NOT NULL;--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN "is_premium" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allows_write_to_pm" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "participated_event_count" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hosted_event_count" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_blocked_the_bot" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_channel_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_support_telegram_user_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_x_link" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_image" varchar(255);--> statement-breakpoint
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
DO $$ BEGIN
 ALTER TABLE "user_custom_flags" ADD CONSTRAINT "user_custom_flags_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
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
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_items_event_uuid_code_uq" ON "coupon_items" USING btree ("event_uuid","code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_custom_flags_user_id_user_flag_index" ON "user_custom_flags" USING btree ("user_id","user_flag");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_is_premium_idx" ON "users" USING btree ("is_premium");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_hosted_event_count_idx" ON "users" USING btree ("hosted_event_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_org_channel_name_idx" ON "users" USING btree ("org_channel_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_id" ON "users" USING btree ("user_id");



ALTER TABLE "event_poa_triggers" ADD COLUMN "creator_user_id" bigint;


DROP VIEW "public"."event_details_search_list";
-- Custom SQL migration file, put you code below! --
CREATE VIEW "public"."event_details_search_list" AS  SELECT e.event_id,
                                                            e.event_uuid,
                                                            e.title,
                                                            e.description,
                                                            e.start_date,
                                                            e.end_date,
                                                            e.type,
                                                            e.society_hub,
                                                            e.society_hub_id,
                                                            e.image_url,
                                                            e.location,
                                                            e.subtitle,
                                                            e."ticketToCheckIn",
                                                            e.timezone,
                                                            e.website,
                                                            e.created_at,
                                                            e.hidden,
                                                            e.city_id,
                                                            e.has_payment,
                                                            e.has_registration,
                                                            e.has_approval,
                                                            city.title AS city,
                                                            e.country_id,
                                                            country.title AS country,
                                                            e.participation_type,
                                                            organizer.user_id AS organizer_user_id,
                                                            organizer.first_name AS organizer_first_name,
                                                            organizer.last_name AS organizer_last_name,
                                                            organizer.username AS organizer_username,
                                                            organizer.photo_url AS organizer_photo_url,
                                                            COALESCE(organizer.org_channel_name, organizer.first_name::character varying) AS organizer_channel_name,
                                                            COALESCE(organizer.org_image, organizer.photo_url::character varying) AS organizer_image,
                                                            organizer.org_bio AS organizer_bio,
                                                            organizer.org_x_link AS organizer_x_link,
                                                            organizer.org_support_telegram_user_name AS organizer_support_telegram_user_name,
                                                            ( SELECT count(t.id) AS count
    FROM tickets t
    WHERE t.event_uuid = e.event_uuid) AS reserved_count,
    ( SELECT count(v.id) AS count
    FROM visitors v
    WHERE v.event_uuid = e.event_uuid) AS visitor_count,
    min_tickets.id AS ticket_id,
    min_tickets.title AS ticket_title,
    min_tickets.description AS ticket_description,
    min_tickets.price AS ticket_price,
    min_tickets.ticket_image,
    min_tickets.payment_type
    FROM events e
    LEFT JOIN users organizer ON e.owner = organizer.user_id
    LEFT JOIN giata_city city ON e.city_id = city.id
    LEFT JOIN giata_city country ON e.country_id = country.id
    LEFT JOIN LATERAL ( SELECT et.id,
    et.title,
    et.description,
    et.price,
    et.ticket_image,
    et.payment_type
    FROM event_payment_info et
    WHERE et.event_uuid = e.event_uuid
    ORDER BY et.price
    LIMIT 1) min_tickets ON true;