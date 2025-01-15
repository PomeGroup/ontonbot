import { db } from "@/db/db";
import crypto from "crypto";
import {
  event_details_search_list,
  eventFields,
  eventRegistrants,
  events,
  rewards,
  tickets,
  users,
  visitors,
} from "@/db/schema";
import { redisTools } from "@/lib/redisTools";
import { removeKey, roundDateToInterval } from "@/lib/utils";
import { selectUserById } from "@/server/db/users";
import { validateMiniAppData } from "@/utils";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { logSQLQuery } from "@/lib/logSQLQuery";
import {  logger } from "../utils/logger";

export const checkIsEventOwner = async (rawInitData: string, eventUuid: string) => {
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
export const checkEventTicketToCheckIn = async (eventUuid: string) => {
  const event = await db
    .select({
      event_uuid: events.event_uuid,
      ticketToCheckIn: events.ticketToCheckIn,
    })
    .from(events)
    .where(eq(events.event_uuid, eventUuid))
    .execute();
  if (!event) {
    return { event_uuid: null, ticketToCheckIn: null };
  }
  return {
    event_uuid: event[0]?.event_uuid,
    ticketToCheckIn: event[0].ticketToCheckIn,
  };
};
export const selectEventByUuid = async (eventUuid: string) => {
  if (eventUuid.length !== 36) {
    return null;
  }

  const eventData = (await db.select().from(events).where(eq(events.event_uuid, eventUuid)).execute()).pop();

  if (!eventData) {
    return null;
  }

  const restEventData = removeKey(eventData, "secret_phrase");

  const dynamicFields = await db
    .select()
    .from(eventFields)
    .where(eq(eventFields.event_id, eventData.event_id))
    .execute()
    // remove the placeholder from dynamic fields
    .then((fields) =>
      fields.map((field) => {
        if (field.title === "secret_phrase_onton_input") {
          return {
            ...field,
            placeholder: "",
          };
        }
        return field;
      })
    );

  dynamicFields.sort((a, b) => a.order_place! - b.order_place!);

  const startUTC = Number(eventData.start_date) * 1000;
  const endUTC = Number(eventData.end_date) * 1000;

  const currentTime = Date.now();
  const isNotEnded = currentTime < endUTC;
  const isStarted = currentTime > startUTC;

  return {
    ...restEventData, // Spread the rest of eventData properties
    society_hub: {
      id: restEventData.society_hub_id,
      name: restEventData.society_hub,
    },
    isStarted,
    isNotEnded,
    dynamic_fields: dynamicFields,
    activity_id: restEventData.activity_id,
  };
};

export const getUserEvents = async (userId: number | null, limit: number | 100, offset: number | 0) => {
  if (userId === null) {
    return [];
  }
  const userInfo = await selectUserById(userId);
  if (!userInfo) {
    return [];
  }

  // 1) Return all events for admin
  if (userInfo.role === "admin") {
    const eventQuery = db
      .select({
        event_uuid: events.event_uuid,
        user_id: users.user_id,
        role: users.role,
        created_at: events.created_at,
      })
      .from(events)
      .innerJoin(users, eq(events.owner, users.user_id));

    return await eventQuery.execute();
  }

  // 2) Non-admin user queries
  // -------------------------
  // a) rewardQuery => from (rewards INNER JOIN visitors)
  const rewardQuery = db
    .select({
      event_uuid: visitors.event_uuid,
      user_id: visitors.user_id,
      role: sql<string>`'participant'`.as("role"),
      created_at: visitors.created_at,
    })
    .from(rewards)
    .innerJoin(visitors, eq(visitors.id, rewards.visitor_id))
    .where(eq(visitors.user_id, userId));

  // // b) eventQuery => events owned by the user if role='organizer'
  // const eventQuery = db
  //   .select({
  //     event_uuid: events.event_uuid,
  //     user_id: users.user_id,
  //     role: users.role,
  //     created_at: events.created_at,
  //   })
  //   .from(events)
  //   .innerJoin(users, eq(events.owner, users.user_id))
  //   .where(and(eq(users.user_id, userId), eq(users.role, "organizer")));

  // c) ticketsQuery => user’s paid events (tickets)
  const ticketsQuery = db
    .select({
      event_uuid: tickets.event_uuid,
      user_id: tickets.user_id,
      role: sql<string>`'participant'`.as("role"),
      created_at: tickets.created_at,
    })
    .from(tickets)
    .where(eq(tickets.user_id, userId));

  // d) registrantQuery => from eventRegistrants table
  const registrantQuery = db
    .select({
      event_uuid: eventRegistrants.event_uuid,
      user_id: eventRegistrants.user_id,
      role: sql<string>`'participant'`.as("role"), // or use eventRegistrants.status if you want
      created_at: eventRegistrants.created_at,
    })
    .from(eventRegistrants)
    .where(eq(eventRegistrants.user_id, userId));

  // 3) Combine queries with unionAll
  //    Drizzle’s unionAll can combine multiple queries of the same shape
  //    (same selected columns & data types).
  //    We then .orderBy, .limit, .offset on the unioned result.
  // @ts-ignore (if needed, depending on your version/typing)
  const combinedResultsQuery = unionAll(rewardQuery,  ticketsQuery, registrantQuery)
    .orderBy((row) => row.created_at)
    .limit(limit)
    .offset(offset);

  // Execute the combined query and return the results
  return await combinedResultsQuery.execute();
};
export const getOrganizerEvents = async (
  organizerId: number,
  limit?: number, // Optional limit
  offset?: number // Optional offset
) => {
  // Set a high limit if none is provided to simulate "no limit"
  const finalLimit = limit !== undefined ? limit : Number.MAX_SAFE_INTEGER;
  const finalOffset = offset !== undefined ? offset : 0;

  const eventsQuery = db
    .select({
      event_uuid: events.event_uuid,
      title: events.title,
      image_url: events.image_url,
      location: events.location,
      start_date: events.start_date,
      end_date: events.end_date,
      participation_type: events.participationType,
      hidden: events.hidden,
      society_hub_id: events.society_hub_id,
      ticket_to_check_in: events.ticketToCheckIn,
      timezone: events.timezone,
    })
    .from(events)
    .where(eq(events.owner, organizerId))
    .orderBy(desc(events.start_date))
    .limit(finalLimit)
    .offset(finalOffset);

  // Return the result of the query
  return await eventsQuery.execute();
};

export const getEventsWithFilters = async (params: z.infer<typeof searchEventsInputZod>): Promise<any[]> => {
  const { limit = 10, cursor = 0, search, filter, sortBy = "default", useCache = false } = params;
  const roundMinutesInMs = 60; // don't touch this fucking value it will break the cache or made unexpected results

  if (filter?.startDate && useCache) {
    filter.startDate = roundDateToInterval(filter?.startDate, roundMinutesInMs);
  }
  if (filter?.endDate && useCache) {
    filter.endDate = roundDateToInterval(filter?.endDate, roundMinutesInMs);
  }
  const stringToHash = JSON.stringify({
    limit,
    cursor,
    search,
    filter,
    sortBy,
  });
  // Create MD5 hash

  const hash = crypto.createHash("md5").update(stringToHash).digest("hex");
  const cacheKey = redisTools.cacheKeys.getEventsWithFilters + hash;
  const cachedResult = await redisTools.getCache(cacheKey);
  if (cachedResult && useCache) {
    /// show return from cache and time
    //logger.log("👙👙 cachedResult 👙👙" + Date.now());
    return cachedResult;
  }

  let query = db.select().from(event_details_search_list);
  let userEventUuids = [];
  // Initialize an array to hold the conditions
  let conditions = [];

  // Apply event type filters
  if (filter?.participationType?.length) {
    conditions.push(
      or(
        filter.participationType.includes("online") ? eq(event_details_search_list.participationType, "online") : sql`false`,
        filter.participationType.includes("in_person")
          ? eq(event_details_search_list.participationType, "in_person")
          : sql`false`
      )
    );
  }
  // Apply user_id filter

  if (filter?.user_id) {
    const userEvents = await getUserEvents(filter.user_id, 1000, 0);
    userEventUuids = userEvents.map((event) => event.event_uuid);
    if (userEventUuids.length) {
      filter.event_uuids = userEventUuids;
    } else {
      return [];
    }
  }
  // Apply date filters
  if (filter?.startDate && filter?.startDateOperator) {
    conditions.push(sql`${event_details_search_list.startDate} ${sql.raw(filter.startDateOperator)} ${filter.startDate}`);
  }

  if (filter?.endDate && filter?.endDateOperator) {
    conditions.push(sql`${event_details_search_list.endDate} ${sql.raw(filter.endDateOperator)} ${filter.endDate}`);
  }

  // Apply hidden condition
  if (!filter?.user_id) conditions.push(sql`${event_details_search_list.hidden} = ${false}`);

  // Apply organizer_user_id filter
  if (filter?.organizer_user_id) {
    conditions.push(eq(event_details_search_list.organizerUserId, filter.organizer_user_id));
  }

  // Apply event_ids filter
  if (filter?.event_ids && filter.event_ids.length) {
    conditions.push(sql`${event_details_search_list.eventId} = any(${filter.event_ids})`);
  }
  // Apply society_hub_id filter
  if (filter?.society_hub_id && filter.society_hub_id.length) {
    conditions.push(inArray(event_details_search_list.societyHubID, filter.society_hub_id));
  }
  // Apply event_uuids filter
  if (filter?.event_uuids && filter.event_uuids.length) {
    const validEventUuids = filter.event_uuids.filter((uuid) => uuid !== null && uuid !== undefined && uuid.length === 36);

    if (validEventUuids.length) {
      conditions.push(inArray(event_details_search_list.eventUuid, validEventUuids));
    }
  }

  // Apply search filters
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        sql`${event_details_search_list.title} ILIKE ${searchPattern}`,
        sql`${event_details_search_list.organizerFirstName} ILIKE ${searchPattern}`,
        sql`${event_details_search_list.organizerLastName} ILIKE ${searchPattern}`,
        sql`${event_details_search_list.location} ILIKE ${searchPattern}`
      )
    );

    let orderByClause;
    if (sortBy === "start_date_asc") {
      orderByClause = sql`start_date ASC`;
    } else if (sortBy === "start_date_desc" || sortBy === "default") {
      orderByClause = sql`start_date DESC`;
    } else if (sortBy === "most_people_reached") {
      orderByClause = sql`visitor_count DESC`;
    }

    // @ts-expect-error
    query = query.orderBy(
      sql`${orderByClause ? sql`${orderByClause},` : sql``}
      greatest(
          similarity(${event_details_search_list.title}, ${search}),
          similarity(${event_details_search_list.location}, ${search})
      ) DESC`
    );
  }

  // Apply all conditions with AND
  if (conditions.length) {
    // @ts-expect-error
    query = query.where(and(...conditions));
  }

  // Apply sorting if no search is specified
  if (!search) {
    if (sortBy === "start_date_asc") {
      // @ts-expect-error
      query = query.orderBy(asc(event_details_search_list.startDate));
    } else if (sortBy === "start_date_desc") {
      // @ts-expect-error
      query = query.orderBy(desc(event_details_search_list.startDate));
    } else if (sortBy === "most_people_reached" || sortBy === "default") {
      // @ts-expect-error
      query = query.orderBy(desc(event_details_search_list.visitorCount));
    } else if (sortBy === "random") {
      // @ts-expect-error
      query = query.orderBy(sql`random()`);
    }
  }

  // Apply pagination

  if (limit) {
    // @ts-expect-error
    query = query.limit(limit).offset(cursor * (limit - 1));
  }

  logSQLQuery(query.toSQL().sql, query.toSQL().params);
  const eventsData = await query.execute();

  await redisTools.setCache(cacheKey, eventsData, redisTools.cacheLvl.guard);
  return eventsData;
};

export const getEventByUuid = async (eventUuid: string, removeSecret: boolean = true) => {
  const event = await db.select().from(events).where(eq(events.event_uuid, eventUuid)).execute();
  if (event === undefined || event.length === 0 ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Event not found  ${eventUuid}`,
    });
  }
  // remove the secret_phrase from the response
  const { secret_phrase, ...restEvent } = event[0];
  return removeSecret ? restEvent : event[0];
};

export const getEventById = async (eventId: number) => {
  const event = await db.select().from(events).where(eq(events.event_id, eventId)).execute();

  return event === undefined || event.length === 0 ? null : event[0];
};

export const getEventsForSpecialRole = async (userRole: string, userId?: number) => {
  if (userRole === "admin") {
    return await db
      .select()
      .from(events)
      .where(eq(events.hidden, false))
      .orderBy(desc(events.created_at))
      .execute();
  } else if (userRole === "organizer" && userId) {
    return await db
      .select()
      .from(events)
      .where(and(eq(events.hidden, false), eq(events.owner, userId)))
      .orderBy(desc(events.created_at))
      .execute();
  } else {
    return [];
  }
};

const eventDB = {
  checkIsEventOwner,
  checkIsAdminOrOrganizer,
  checkEventTicketToCheckIn,
  selectEventByUuid,
  getUserEvents,
  getOrganizerEvents,
  getEventsWithFilters,
  getEventByUuid,
  getEventById,
  getEventsForSpecialRole,
};
export default eventDB;
