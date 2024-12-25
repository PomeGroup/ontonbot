DO $$ BEGIN
 CREATE TYPE "public"."event_poa_result_status" AS ENUM('REPLIED', 'EXPIRED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_trigger_status" AS ENUM('active', 'deactive', 'completed', 'sending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_trigger_type" AS ENUM('simple', 'multiple_choice', 'question', 'password');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_item_type" AS ENUM('POA_TRIGGER', 'EVENT', 'SBT_REWARD', 'TRANSACTION', 'UNKNOWN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_status" AS ENUM('WAITING_TO_SEND', 'DELIVERED', 'READ', 'REPLIED', 'EXPIRED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('POA_SIMPLE', 'POA_PASSWORD', 'POA_CREATION_FOR_ORGANIZER', 'USER_RECEIVED_POA', 'USER_ANSWER_POA', 'MESSAGE_SIMPLE', 'UNKNOWN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- DO $$ BEGIN
--  CREATE TYPE "public"."order_types" AS ENUM('nft_mint', 'offchain_ticket', 'event_creation', 'event_capacity_increment');
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;
--> statement-breakpoint
-- DO $$ BEGIN
--  CREATE TYPE "public"."payment_types" AS ENUM('USDT', 'TON');
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;
--> statement-breakpoint
-- DO $$ BEGIN
--  CREATE TYPE "public"."ticket_types" AS ENUM('OFFCHAIN', 'NFT');
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;
--> statement-breakpoint
--> statement-breakpoint

/* -------------------------------------------------------------------------- */
/*                             Create ORDER STATE                             */
/* -------------------------------------------------------------------------- */
-- ALTER TABLE orders ALTER COLUMN state TYPE TEXT USING state::TEXT;
-- UPDATE orders
-- SET state = CASE
--     WHEN state = 'created' THEN 'new'
--     WHEN state = 'mint_request' THEN 'processing'
--     WHEN state = 'minted' THEN 'completed'
--     WHEN state = 'failed' THEN 'failed'
--     WHEN state = 'validation_failed' THEN 'cancelled'
--     ELSE state
-- END;
-- CREATE TYPE "public"."order_state_new" AS ENUM(
--     'new',
--     'confirming',
--     'processing',
--     'completed',
--     'failed',
--     'cancelled'
-- );
-- ALTER TABLE orders ALTER COLUMN state TYPE "public"."order_state_new" USING state::TEXT::"public"."order_state_new";
-- DROP TYPE "public"."order_state";
-- ALTER TYPE "public"."order_state_new" RENAME TO "order_state";



CREATE TABLE IF NOT EXISTS "event_poa_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"poa_id" integer,
	"event_id" integer,
	"poa_answer" varchar(255),
	"status" "event_poa_result_status",
	"replied_at" timestamp (6),
	"notification_id" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_poa_triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"poa_order" smallint,
	"start_time" integer,
	"count_of_sent" integer,
	"count_of_success" integer,
	"poa_type" "event_trigger_type" DEFAULT 'simple',
	"status" "event_trigger_status" DEFAULT 'active',
	"created_at" timestamp (6),
	"updated_at" timestamp (6)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"type" "notification_type" DEFAULT 'UNKNOWN',
	"title" varchar(255),
	"desc" varchar(255),
	"priority" smallint,
	"icon" varchar(255),
	"image" varchar(255),
	"link" varchar(255),
	"action_time_out" serial NOT NULL,
	"action_reply" json,
	"additional_data" json,
	"status" "notification_status" DEFAULT 'WAITING_TO_SEND',
	"created_at" timestamp (6),
	"read_at" timestamp (6),
	"expires_at" timestamp (6),
	"item_id" serial NOT NULL,
	"item_type" "notification_item_type" DEFAULT 'UNKNOWN'
);
--> statement-breakpoint
-- ALTER TABLE "event_tickets" RENAME TO "event_payment_info";--> statement-breakpoint
-- ALTER TABLE "orders" RENAME COLUMN "utm" TO "utm_source";--> statement-breakpoint
-- ALTER TABLE "event_payment_info" DROP CONSTRAINT "event_tickets_event_uuid_events_event_uuid_fk";
--> statement-breakpoint
-- ALTER TABLE "orders" DROP CONSTRAINT "orders_event_ticket_id_event_tickets_id_fk";
--> statement-breakpoint
-- ALTER TABLE "tickets" DROP CONSTRAINT "tickets_event_ticket_id_event_tickets_id_fk";
--> statement-breakpoint
-- DROP INDEX IF EXISTS "eventt_title_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "eventt_price_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "eventt_collection_address_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "eventt_created_at_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "eventt_updated_at_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "orders_event_ticket_id_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "orders_transaction_id_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "orders_telegram_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "orders_full_name_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "orders_company_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "orders_created_at_idx";--> statement-breakpoint
-- DROP INDEX IF EXISTS "orders_updated_at_idx";--> statement-breakpoint

/* -------------------------------------------------------------------------- */
/*                                 BE CAREFUL                                 */
/* -------------------------------------------------------------------------- */

-- DROP VIEW "public"."event_details_search_list";

-- ALTER TABLE "event_payment_info" 
-- ALTER COLUMN "price" TYPE real 
-- USING price::real;



/* -------------------------------------------------------------------------- */
/*                                 BE CAREFUL                                 */
/* -------------------------------------------------------------------------- */

ALTER TABLE "events" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "subtitle" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "end_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "end_date" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "orders" ALTER COLUMN "total_price" SET DATA TYPE real;--> statement-breakpoint
-- ALTER TABLE "orders" ALTER COLUMN "total_price" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "orders" ALTER COLUMN "state" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "orders" ALTER COLUMN "owner_address" DROP NOT NULL;--> statement-breakpoint
-- ALTER TABLE "orders" ALTER COLUMN "utm_source" SET DEFAULT '';--> statement-breakpoint
-- ALTER TABLE "event_payment_info" ADD COLUMN "payment_type" "payment_types" NOT NULL DEFAULT 'TON';--> statement-breakpoint
-- ALTER TABLE "event_payment_info" ADD COLUMN "recipient_address" text NOT NULL DEFAULT '';--> statement-breakpoint
-- ALTER TABLE "event_payment_info" ADD COLUMN "bought_capacity" integer NOT NULL DEFAULT 0;--> statement-breakpoint
-- ALTER TABLE "event_payment_info" ADD COLUMN "ticket_type" "ticket_types" NOT NULL DEFAULT 'NFT';--> statement-breakpoint
-- ALTER TABLE "events" ADD COLUMN "enabled" boolean DEFAULT true;--> statement-breakpoint
-- ALTER TABLE "events" ADD COLUMN "has_payment" boolean DEFAULT false;--> statement-breakpoint
-- ALTER TABLE "orders" ADD COLUMN "payment_type" "payment_types" NOT NULL DEFAULT 'TON';--> statement-breakpoint
-- ALTER TABLE "orders" ADD COLUMN "order_type" "order_types" NOT NULL DEFAULT 'nft_mint';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_poa_results" ADD CONSTRAINT "event_poa_results_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_poa_results" ADD CONSTRAINT "event_poa_results_poa_id_event_poa_triggers_id_fk" FOREIGN KEY ("poa_id") REFERENCES "public"."event_poa_triggers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_poa_results" ADD CONSTRAINT "event_poa_results_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_poa_triggers" ADD CONSTRAINT "event_poa_triggers_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_user_id_type_item_id_item_type_key" ON "notifications" USING btree ("user_id","type","item_id","item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_expires_at_idx" ON "notifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_item_id_item_type_idx" ON "notifications" USING btree ("item_id","item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
-- DO $$ BEGIN
--  ALTER TABLE "event_payment_info" ADD CONSTRAINT "event_payment_info_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE no action ON UPDATE no action;
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;
--> statement-breakpoint
-- DO $$ BEGIN
--  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_ticket_id_event_payment_info_id_fk" FOREIGN KEY ("event_ticket_id") REFERENCES "public"."event_payment_info"("id") ON DELETE no action ON UPDATE no action;
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;
--> statement-breakpoint
-- CREATE UNIQUE INDEX IF NOT EXISTS "event_payment_info_event_uuid_index" ON "event_payment_info" USING btree ("event_uuid");--> statement-breakpoint
-- CREATE UNIQUE INDEX IF NOT EXISTS "events_event_uuid_index" ON "events" USING btree ("event_uuid");--> statement-breakpoint
-- ALTER TABLE "event_payment_info" DROP COLUMN IF EXISTS "count";--> statement-breakpoint
-- ALTER TABLE "events" DROP COLUMN IF EXISTS "wallet_seed_phrase";--> statement-breakpoint
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "event_ticket_id";--> statement-breakpoint
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "transaction_id";--> statement-breakpoint
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "count";--> statement-breakpoint
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "failed_reason";--> statement-breakpoint
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "telegram";--> statement-breakpoint
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "full_name";--> statement-breakpoint
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "company";--> statement-breakpoint
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "position";



-- CREATE VIEW "public"."event_details_search_list" AS  SELECT e.event_id,
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
    city.title AS city,
    e.country_id,
    country.title AS country,
    e.participation_type,
    organizer.user_id AS organizer_user_id,
    organizer.first_name AS organizer_first_name,
    organizer.last_name AS organizer_last_name,
    organizer.username AS organizer_username,
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
    min_tickets.ticket_image
   FROM events e
     LEFT JOIN users organizer ON e.owner = organizer.user_id
     LEFT JOIN giata_city city ON e.city_id = city.id
     LEFT JOIN giata_city country ON e.country_id = country.id
     LEFT JOIN LATERAL ( SELECT et.id,
            et.title,
            et.description,
            et.price,
            et.ticket_image
           FROM event_payment_info et
          WHERE et.event_uuid = e.event_uuid
          ORDER BY et.price
         LIMIT 1) min_tickets ON true;