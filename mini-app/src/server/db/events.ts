import { db } from "@/db/db";
import { eventFields, events, users,tickets } from "@/db/schema";
import { removeKey } from "@/lib/utils";
import { validateMiniAppData } from "@/utils";
import { sql, eq, and, or, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { logSQLQuery ,executeAndLogQuery } from "@/server/utils/logSQLQuery";

export const checkIsEventOwner = async (
  rawInitData: string,
  eventUuid: string
) => {
  const { initDataJson, valid } = await checkIsAdminOrOrganizer(rawInitData);

  if (!valid) {
    return { isOwner: false, valid, initDataJson };
  }

  const event = await db
    .select()
    .from(events)
    .where(and(eq(events.event_uuid, eventUuid), eq(events.hidden, false)))
    .execute();

  if (!event || event[0].owner !== initDataJson.user.id) {
    return { isOwner: false, valid, initDataJson };
  }

  return { isOwner: true, valid, initDataJson };
};

export const checkIsAdminOrOrganizer = async (rawInitData: string) => {
  const data = validateMiniAppData(rawInitData);

  if (!data.valid) {
    return { role: null, ...data };
  }

  const role = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.user_id, data.initDataJson.user.id))
    .execute();

  if (!role || (role[0].role !== "admin" && role[0].role !== "organizer")) {
    return { role: role[0].role, ...data };
  }

  return { role: role[0].role, ...data };
};

export const selectEventByUuid = async (eventUuid: string) => {
  if (eventUuid.length !== 36) {
    return null;
  }

  const eventData = (
    await db
      .select()
      .from(events)
      .where(and(eq(events.event_uuid, eventUuid), eq(events.hidden, false)))
      .execute()
  ).pop();

  if (!eventData) {
    return null;
  }

  const { wallet_seed_phrase, ...restEventData } = removeKey(
    eventData,
    "secret_phrase"
  );

  const dynamicFields = await db
    .select()
    .from(eventFields)
    .where(eq(eventFields.event_id, eventData.event_id))
    .execute();

  dynamicFields.sort((a, b) => a.order_place! - b.order_place!);

  return {
    ...restEventData, // Spread the rest of eventData properties
    society_hub: {
      id: restEventData.society_hub_id,
      name: restEventData.society_hub,
    },
    dynamic_fields: dynamicFields,
    activity_id: restEventData.activity_id,
  };
};



// Define input schema using zod
const getEventsInputSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  search: z.string().optional(),
  filter: z.object({
    eventTypes: z.array(z.enum(["online", "in_person"])).optional(),
  }).optional(),
  sortBy: z.enum(["default", "time", "most_people_reached"]).optional(),
});

// Type for the reserved count
interface ReservedCount {
  reserved_count: number;
}

// Arrow function to get events with pagination, filtering, and sorting
export const getEventsWithFilters = async (params: z.infer<typeof getEventsInputSchema>) => {
  const { limit = 10, offset = 0, search, filter, sortBy = "default" } = params;
  console.log("*****params",params);
  let query = db
      .select()
      .from(events)
      .leftJoin(users, eq(events.owner, users.user_id))
      .leftJoin(tickets, sql`${events.event_uuid} = ${tickets.event_uuid}::uuid`) // Cast event_uuid to text
      .where(sql`true`);

  // Apply search filters
  if (search) {
    query = query.where(
        or(
            sql`lower(${events.title}) like ${`%${search.toLowerCase()}%`}`,
            sql`lower(${users.first_name}) like ${`%${search.toLowerCase()}%`}`,
            sql`lower(${users.last_name}) like ${`%${search.toLowerCase()}%`}`
        )
    );
  }

  // Apply event type filters
  if (filter?.eventTypes?.length) {
    query = query.where(
        or(
            filter.eventTypes.includes("online") ? eq(events.type, 1) : sql`false`,
            filter.eventTypes.includes("in_person") ? eq(events.type, 2) : sql`false`
        )
    );
  }

  // Apply sorting
  if (sortBy === "time") {
    query = query.orderBy(desc(events.start_date));
  } else if (sortBy === "most_people_reached") {
    query = query
        .groupBy(events.event_id)
        .orderBy(desc(sql`count(${tickets.id})`));
  } else {
    query = query.orderBy(desc(events.created_at));
  }

  // Apply pagination
  query = query.limit(limit).offset(offset);
  // Get the SQL string and parameters

  // // Get the SQL string and parameters

  const eventsData = await query.execute();
  const { sql: sqlString, params:paraSql } = query.toSQL();
  logSQLQuery( sqlString, paraSql);
  console.log("*****eventsData",eventsData);

  // Calculate the count of reserved tickets for each event
  const eventsWithTicketCount = await Promise.all(
      eventsData.map(async (event) => {
        const ticketCount = await executeAndLogQuery(
            db
                .select(sql`count(${tickets.id}) as reserved_count`)
                .from(tickets)
                .where(eq(tickets.event_uuid, event.event_uuid))
        );

        // Convert the result to unknown first, then cast to ReservedCount[]
        const reservedCount = ticketCount as unknown as ReservedCount[];
        return { ...event, reserved_count: reservedCount[0].reserved_count };
      })
  );

  return eventsWithTicketCount;
};