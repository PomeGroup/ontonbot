CREATE TABLE IF NOT EXISTS "airdrop_routines" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" serial NOT NULL,
	"user_id" bigint,
	"status" text,
	"created_at" timestamp DEFAULT now()
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
	"event_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"event_id" serial PRIMARY KEY NOT NULL,
	"event_uuid" uuid,
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
	"owner" bigint,
	"hidden" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_event_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_field_id" serial NOT NULL,
	"user_id" bigint,
	"data" text,
	"completed" boolean,
	"created_at" timestamp DEFAULT now(),
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
	"role" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visitors" (
	"user_id" bigint,
	"event_uuid" uuid,
	"claimed" integer,
	"amount" integer,
	"tx_hash" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airdrop_routines" ADD CONSTRAINT "airdrop_routines_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airdrop_routines" ADD CONSTRAINT "airdrop_routines_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_fields" ADD CONSTRAINT "event_fields_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_owner_users_user_id_fk" FOREIGN KEY ("owner") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_event_fields" ADD CONSTRAINT "user_event_fields_event_field_id_event_fields_id_fk" FOREIGN KEY ("event_field_id") REFERENCES "event_fields"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_event_fields" ADD CONSTRAINT "user_event_fields_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visitors" ADD CONSTRAINT "visitors_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visitors" ADD CONSTRAINT "visitors_event_uuid_events_event_uuid_fk" FOREIGN KEY ("event_uuid") REFERENCES "events"("event_uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
