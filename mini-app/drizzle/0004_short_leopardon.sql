DO $$ BEGIN
 CREATE TYPE "public"."event_trigger_status" AS ENUM('active', 'deactive', 'completed', 'sending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_trigger_type" AS ENUM('simple', 'multiple_choice', 'question');
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
 CREATE TYPE "public"."notification_type" AS ENUM('POA_SIMPLE', 'MESSAGE_SIMPLE', 'UNKNOWN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_poa_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"poa_id" integer,
	"event_id" integer,
	"poa_answer" varchar(255),
	"status" text,
	"replied_at" timestamp (6),
	"notification_id" integer
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
	"user_id" serial NOT NULL,
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
