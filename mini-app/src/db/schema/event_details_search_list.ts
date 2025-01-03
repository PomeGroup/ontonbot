import { eventPayment, eventPayment as tickets } from "@/db/schema/eventPayment";
import { events } from "@/db/schema/events";
import { giataCity } from "@/db/schema/giataCity";
import { users } from "@/db/schema/users";
import { visitors } from "@/db/schema/visitors";
import { sql } from "drizzle-orm";
import { bigint, boolean, integer, pgView, text, timestamp, uuid } from "drizzle-orm/pg-core";

// this view is used to get the event details with the ticket and visitor count
export const event_details_search_list = pgView("event_details_search_list", {
  eventId: bigint("event_id", { mode: "number" }),
  eventUuid: uuid("event_uuid"),
  title: text("title"),
  description: text("description"),
  startDate: bigint("start_date", { mode: "number" }),
  endDate: bigint("end_date", { mode: "number" }),
  type: text("type"),
  societyHub: text("society_hub"),
  societyHubID: bigint("society_hub_id", { mode: "number" }),
  imageUrl: text("image_url"),
  location: text("location"),
  subtitle: text("subtitle"),
  ticketToCheckIn: boolean("ticketToCheckIn"),
  timezone: text("timezone"),
  website: text("website"),
  createdAt: timestamp("created_at"),
  hidden: boolean("hidden"),
  participationType: text("participation_type"),
  organizerUserId: bigint("organizer_user_id", { mode: "number" }),
  organizerFirstName: text("organizer_first_name"),
  organizerLastName: text("organizer_last_name"),
  organizerUsername: text("organizer_username"),
  reservedCount: bigint("reserved_count", { mode: "number" }),
  visitorCount: bigint("visitor_count", { mode: "number" }),
  ticketId: bigint("ticket_id", { mode: "number" }),
  ticketTitle: text("ticket_title"),
  ticketDescription: text("ticket_description"),
  ticketPrice: text("ticket_price"),
  ticketImage: text("ticket_image"),
  hasPayment: boolean("has_payment"),
  hasRegistration: boolean("has_registration"),
  hasApproval: boolean("has_approval"),
  // ticketCount: integer("ticket_count"),
}).as(sql`
  SELECT
    e.event_id,
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
    e.country_id,
    e.city_id,   
    country.title AS country,
    city.title AS city,
    organizer.user_id AS organizer_user_id,
    organizer.first_name AS organizer_first_name,
    organizer.last_name AS organizer_last_name,
    organizer.username AS organizer_username,
    (SELECT count(t.id) AS count
     FROM ${tickets} t
     WHERE t.event_uuid::uuid = e.event_uuid) AS reserved_count,
    (SELECT count(v.id) AS count
     FROM ${visitors} v
     WHERE v.event_uuid = e.event_uuid) AS visitor_count,
    min_tickets.id AS ticket_id,
    min_tickets.title AS ticket_title,
    min_tickets.description AS ticket_description,
    min_tickets.price AS ticket_price,
    min_tickets.ticket_image
  FROM
    ${events} e
  LEFT JOIN
    ${users} organizer ON e.owner = organizer.user_id
  LEFT JOIN 
    ${giataCity} city ON e.city_id = city.id
  LEFT JOIN 
    ${giataCity} country ON e.country_id = country.id
  LEFT JOIN
    LATERAL (SELECT et.id,
                    
                    
                    et.price,
                    et.ticket_image,
                    
             FROM ${eventPayment} et
             WHERE et.event_uuid = e.event_uuid
             ORDER BY et.price
             LIMIT 1) min_tickets ON true
`);
