DO $$ BEGIN
 CREATE TYPE "public"."event_participation_type" AS ENUM('in_person', 'online');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP TABLE "event_details_search_list";--> statement-breakpoint
DROP VIEW "event_details_search_list";--> statement-breakpoint
ALTER TABLE "event_tickets" ALTER COLUMN "event_uuid" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "event_uuid" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "event_uuid" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "airdrop_routines" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "airdrop_routines" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_fields" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "event_fields" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_tickets" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "event_tickets" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "participation_type" "event_participation_type" DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_event_fields" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "user_event_fields" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_updated_at_idx" ON "airdrop_routines" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_updated_at_idx" ON "event_fields" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_updated_at_idx" ON "event_tickets" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_updated_at_idx" ON "events" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_participation_type_idx" ON "events" USING btree ("participation_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_updated_at_idx" ON "orders" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_updated_at_idx" ON "rewards" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_updated_at_idx" ON "user_event_fields" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_updated_at_idx" ON "visitors" USING btree ("updated_at");


-- For table "event_tickets"
ALTER TABLE "event_tickets"
ALTER COLUMN "event_uuid" TYPE uuid USING ("event_uuid"::uuid);

-- For table "orders"
ALTER TABLE "orders"
ALTER COLUMN "event_uuid" TYPE uuid USING ("event_uuid"::uuid);

-- For table "tickets"
ALTER TABLE "tickets"
ALTER COLUMN "event_uuid" TYPE uuid USING ("event_uuid"::uuid);

CREATE OR REPLACE VIEW "public"."event_details_search_list" AS
SELECT
    e.event_id,
    e.event_uuid,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.type,
    e.society_hub,
    e.image_url,
    e.location,
    e.subtitle,
    e."ticketToCheckIn",
    e.timezone,
    e.website,
    e.created_at,
    e.hidden,  -- Adding the hidden column here
    e.participation_type,  -- Adding the participation_type column here
    organizer.user_id AS organizer_user_id,
    organizer.first_name AS organizer_first_name,
    organizer.last_name AS organizer_last_name,
    organizer.username AS organizer_username,
    (SELECT count(t.id) AS count
     FROM tickets t
     WHERE t.event_uuid::uuid = e.event_uuid) AS reserved_count,
    (SELECT count(v.id) AS count
     FROM visitors v
     WHERE v.event_uuid = e.event_uuid) AS visitor_count,
    min_tickets.id AS ticket_id,
    min_tickets.title AS ticket_title,
    min_tickets.description AS ticket_description,
    min_tickets.price AS ticket_price,
    min_tickets.ticket_image,
    min_tickets.count AS ticket_count
FROM
    events e
LEFT JOIN
    users organizer ON e.owner = organizer.user_id
LEFT JOIN
    LATERAL (SELECT et.id,
                    et.title,
                    et.description,
                    et.price,
                    et.ticket_image,
                    et.count
             FROM event_tickets et
             WHERE et.event_uuid = e.event_uuid
             ORDER BY et.price
             LIMIT 1) min_tickets ON true;
