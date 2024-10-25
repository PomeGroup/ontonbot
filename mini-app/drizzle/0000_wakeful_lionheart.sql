DO $$ BEGIN
 CREATE TYPE "public"."development_environment" AS ENUM('local', 'development', 'staging', 'production');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_participation_type" AS ENUM('in_person', 'online');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."order_state" AS ENUM('created', 'mint_request', 'minted', 'failed', 'validation_failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."reward_status" AS ENUM('pending_creation', 'created', 'created_by_ui', 'received', 'notified', 'notified_by_ui', 'notification_failed', 'failed', 'fixed_failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."reward_types" AS ENUM('ton_society_sbt');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_ticket_status" AS ENUM('MINTING', 'USED', 'UNUSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "airdrop_routines" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" serial NOT NULL,
	"user_id" bigint,
	"status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"emoji" text,
	"title" text,
	"description" text,
	"placeholder" text,
	"type" text,
	"order_place" integer,
	"event_id" integer,
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_uuid" uuid,
	"title" text,
	"description" text,
	"price" text NOT NULL,
	"ticket_image" text,
	"count" integer,
	"collection_address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"event_id" serial PRIMARY KEY NOT NULL,
	"event_uuid" uuid NOT NULL,
	"type" integer,
	"title" text,
	"subtitle" text,
	"description" text,
	"image_url" text,
	"wallet_address" text,
	"wallet_seed_phrase" text,
	"society_hub" text,
	"society_hub_id" text,
	"activity_id" integer,
	"collection_address" text,
	"secret_phrase" text DEFAULT '',
	"start_date" integer,
	"end_date" integer DEFAULT 0,
	"timezone" text,
	"location" text,
	"website" json,
	"owner" bigint,
	"hidden" boolean DEFAULT false,
	"ticketToCheckIn" boolean DEFAULT false,
	"participation_type" "event_participation_type" DEFAULT 'online' NOT NULL,
	"city_id" integer,
	"country_id" integer,
	"ts_reward_image" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "giata_city" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"parent_id" integer NOT NULL,
	"insert_date" integer NOT NULL,
	"abbreviated_code" text NOT NULL,
	"giata_code" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onton_setting" (
	"env" "development_environment" NOT NULL,
	"var" varchar(255) NOT NULL,
	"value" text,
	"protected" boolean DEFAULT true,
	CONSTRAINT "onton_setting_env_var_pk" PRIMARY KEY("env","var")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_uuid" uuid,
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
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" serial NOT NULL,
	"type" "reward_types",
	"data" json,
	"try_count" integer DEFAULT 0 NOT NULL,
	"status" "reward_status" DEFAULT 'created' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"telegram" text,
	"company" text,
	"position" text,
	"order_uuid" text,
	"status" "event_ticket_status",
	"nft_address" text,
	"event_uuid" uuid,
	"event_ticket_id" integer NOT NULL,
	"user_id" bigint,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_event_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_field_id" serial NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" bigint,
	"data" text,
	"completed" boolean,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL,
	CONSTRAINT "user_event_fields_event_field_id_user_id_unique" UNIQUE("event_field_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"wallet_address" text,
	"language_code" text,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"event_uuid" uuid NOT NULL,
	"claimed" integer,
	"amount" integer,
	"tx_hash" text,
	"last_visit" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airdrop_routines" ADD CONSTRAINT "airdrop_routines_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airdrop_routines" ADD CONSTRAINT "airdrop_routines_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_fields" ADD CONSTRAINT "event_fields_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_owner_users_user_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_city_id_giata_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."giata_city"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_country_id_giata_city_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."giata_city"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_event_ticket_id_event_tickets_id_fk" FOREIGN KEY ("event_ticket_id") REFERENCES "public"."event_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rewards" ADD CONSTRAINT "rewards_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_uuid_orders_uuid_fk" FOREIGN KEY ("order_uuid") REFERENCES "public"."orders"("uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_ticket_id_event_tickets_id_fk" FOREIGN KEY ("event_ticket_id") REFERENCES "public"."event_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_event_fields" ADD CONSTRAINT "user_event_fields_event_field_id_event_fields_id_fk" FOREIGN KEY ("event_field_id") REFERENCES "public"."event_fields"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_event_fields" ADD CONSTRAINT "user_event_fields_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_event_fields" ADD CONSTRAINT "user_event_fields_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visitors" ADD CONSTRAINT "visitors_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visitors" ADD CONSTRAINT "visitors_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "public"."events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_event_id_idx" ON "airdrop_routines" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_user_id_idx" ON "airdrop_routines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_status_idx" ON "airdrop_routines" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_created_at_idx" ON "airdrop_routines" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_updated_at_idx" ON "airdrop_routines" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_title_idx" ON "event_fields" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_type_idx" ON "event_fields" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_event_id_idx" ON "event_fields" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_updated_at_idx" ON "event_fields" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_event_uuid_idx" ON "event_tickets" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_title_idx" ON "event_tickets" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_price_idx" ON "event_tickets" USING btree ("price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_collection_address_idx" ON "event_tickets" USING btree ("collection_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_created_at_idx" ON "event_tickets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_updated_at_idx" ON "event_tickets" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_event_uuid_idx" ON "events" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_title_idx" ON "events" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_wallet_address_idx" ON "events" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_society_hub_idx" ON "events" USING btree ("society_hub");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_start_date_idx" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_end_date_idx" ON "events" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_owner_idx" ON "events" USING btree ("owner");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_hidden_idx" ON "events" USING btree ("hidden");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_updated_at_idx" ON "events" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_participation_type_idx" ON "events" USING btree ("participation_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_title_idx" ON "giata_city" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_parent_id_idx" ON "giata_city" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_insert_date_idx" ON "giata_city" USING btree ("insert_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_abbreviated_code_idx" ON "giata_city" USING btree ("abbreviated_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_giata_code_idx" ON "giata_city" USING btree ("giata_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_event_uuid_idx" ON "orders" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_event_ticket_id_idx" ON "orders" USING btree ("event_ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_transaction_id_idx" ON "orders" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_state_idx" ON "orders" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_telegram_idx" ON "orders" USING btree ("telegram");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_full_name_idx" ON "orders" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_company_idx" ON "orders" USING btree ("company");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_owner_address_idx" ON "orders" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_updated_at_idx" ON "orders" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_visitor_id_idx" ON "rewards" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_type_idx" ON "rewards" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_status_idx" ON "rewards" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_created_at_idx" ON "rewards" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_updated_at_idx" ON "rewards" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_name_idx" ON "tickets" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_telegram_idx" ON "tickets" USING btree ("telegram");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_company_idx" ON "tickets" USING btree ("company");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_order_uuid_idx" ON "tickets" USING btree ("order_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_nft_address_idx" ON "tickets" USING btree ("nft_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_event_uuid_idx" ON "tickets" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_ticket_id_idx" ON "tickets" USING btree ("event_ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_user_id_idx" ON "tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_created_at_idx" ON "tickets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_event_id_idx" ON "user_event_fields" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_event_field_id_idx" ON "user_event_fields" USING btree ("event_field_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_user_id_idx" ON "user_event_fields" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_completed_idx" ON "user_event_fields" USING btree ("completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_created_at_idx" ON "user_event_fields" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_updated_at_idx" ON "user_event_fields" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_wallet_address_idx" ON "users" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_user_id_idx" ON "visitors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_event_uuid_idx" ON "visitors" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_last_visit_idx" ON "visitors" USING btree ("last_visit");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_created_at_idx" ON "visitors" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_updated_at_idx" ON "visitors" USING btree ("updated_at");