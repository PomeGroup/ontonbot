CREATE TABLE IF NOT EXISTS "giata_city" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"parent_id" integer NOT NULL,
	"insert_date" integer NOT NULL,
	"abbreviated_code" text NOT NULL,
	"giata_code" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "city_id" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "country_id" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_title_idx" ON "giata_city" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_parent_id_idx" ON "giata_city" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_insert_date_idx" ON "giata_city" USING btree ("insert_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_abbreviated_code_idx" ON "giata_city" USING btree ("abbreviated_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_giata_code_idx" ON "giata_city" USING btree ("giata_code");--> statement-breakpoint
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
CREATE OR REPLACE VIEW  "public"."event_details_search_list" AS  SELECT e.event_id,
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
    min_tickets.ticket_image,
    min_tickets.count AS ticket_count
   FROM events e
     LEFT JOIN users organizer ON e.owner = organizer.user_id
     LEFT JOIN LATERAL ( SELECT et.id,
            et.title,
            et.description,
            et.price,
            et.ticket_image,
            et.count
           FROM event_tickets et
          WHERE et.event_uuid = e.event_uuid
          ORDER BY et.price
         LIMIT 1) min_tickets ON true;

END $$;

