-- Custom SQL migration file, put you code below! --
DO $$ BEGIN
DROP VIEW "event_details_search_list";
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
    min_tickets.ticket_image,
    min_tickets.count AS ticket_count
   FROM events e
     LEFT JOIN users organizer ON e.owner = organizer.user_id
     LEFT JOIN giata_city city ON e.city_id = city.id
     LEFT JOIN giata_city country ON e.country_id = country.id
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
-- Custom SQL for inserting default values for homeSliderEventUUID --
DO $$ BEGIN
INSERT INTO "public"."onton_setting" ("env", "var", "value", "protected") VALUES ('development', 'homeSliderEventUUID', '11081690-9d38-4168-82d1-00aa34837a24', 'f');
INSERT INTO "public"."onton_setting" ("env", "var", "value", "protected") VALUES ('staging', 'homeSliderEventUUID', 'f1387b5c-d685-4265-a480-7ac31beb2101', 'f');
INSERT INTO "public"."onton_setting" ("env", "var", "value", "protected") VALUES ('production', 'homeSliderEventUUID', '43d33878-a1ba-4209-9169-4845066004c6', 'f');
END $$;
