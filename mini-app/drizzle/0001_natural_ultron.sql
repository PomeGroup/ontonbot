DO $$ BEGIN
 CREATE TYPE "event_ticket_status" AS ENUM('USED', 'VALID');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" serial NOT NULL,
	"title" text,
	"description" text,
	"price" integer,
	"ticket_image" text,
	"count" integer,
	"collection_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"telegram" text,
	"company" text,
	"position" text,
	"status" "event_ticket_status",
	"nft_address" text,
	"event_id" serial NOT NULL,
	"event_ticket_id" serial NOT NULL,
	"user_id" bigint,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "ticketToCheckIn" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_ticket_id_event_tickets_id_fk" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
