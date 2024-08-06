import { db } from "@/db/db";
import {eventFields, events, users, tickets, event_details_search_list} from "@/db/schema";
import { removeKey } from "@/lib/utils";
import { validateMiniAppData } from "@/utils";
import { sql, eq, and, or, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { logSQLQuery  } from "@/lib/logSQLQuery";
import {cacheKeys,  getCache, setCache} from "@/lib/cache";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";

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



/**
 * Retrieves events with pagination, filtering, and sorting.
 *
 * @param {object} params - The parameters for the query.
 * @param {number} params.limit - The maximum number of events to return (default is 10, min is 1, max is 10).
 * @param {number} params.offset - The number of events to skip (default is 0).
 * @param {string} params.search - The search term for full-text search on event title, organizer first name, organizer last name, and location.
 * @param {object} params.filter - The filter criteria for the events.
 * @param {array} params.filter.eventTypes - The event types to filter by (either "online" or "in_person").
 * @param {number} params.filter.startDate - The start date to filter events from.
 * @param {number} params.filter.endDate - The end date to filter events to.
 * @param {number} params.filter.organizer_user_id - The user ID of the event organizer to filter by.
 * @param {array} params.filter.event_ids - The event IDs to filter by.
 * @param {array} params.filter.event_uuids - The event UUIDs to filter by.
 * @param {string} params.sortBy - The sorting criteria (default, time, most_people_reached, start_date_asc, start_date_desc).
 *
 * @returns {Promise<Array>} - A promise that resolves to an array of events.
 *
 * @example
 * // Postman request example:
 * // http://localhost:3000/api/trpc/events.getEventsWithFilters?batch=1&input={"0":{"limit":10,"offset":0,"search": "Yuki","filter":{"eventTypes":["online","in_person"]},"sortBy":"most_people_reached"}}}
 * // http://localhost:3000/api/trpc/events.getEventsWithFilters?batch=1&input={"0":{"limit":10,"offset":0,"search": "istanbul","filter":{"eventTypes":["online","in_person"],"startDate":"2024-07-01","endDate":"2024-07-31"},"sortBy":"time"}}}
 * // http://localhost:3000/api/trpc/events.getEventsWithFilters?batch=1&input={"0":{"limit":10,"offset":0,"search": "istanbul","filter":{"eventTypes":["online","in_person"]},"sortBy":"time"}}}
 */
export const getEventsWithFilters = async (params: z.infer<typeof searchEventsInputZod>): Promise<any[]> => {
    const { limit = 10, offset = 0, search, filter, sortBy = "default" } = params;
    console.log("*****params", params);

    // Generate a cache key based on the input parameters
    const cacheKey = cacheKeys.getEventsWithFilters + JSON.stringify({ limit, offset, search, filter, sortBy });

    // Check if the result is already cached
    const cachedResult = getCache(cacheKey);
    if (cachedResult) {
        console.log("Returning cached result");
        console.log(cachedResult);
        return cachedResult;
    }

    let query = db
        .select()
        .from(event_details_search_list);

    // Apply event type filters
    if (filter?.eventTypes?.length) {
        query = query.where(
            or(
                filter.eventTypes.includes("online") ? eq(event_details_search_list.type, 1) : sql`false`,
                filter.eventTypes.includes("in_person") ? eq(event_details_search_list.type, 2) : sql`false`
            )
        );
    }

    // Apply date filters
    if (filter?.startDate) {
        query = query.where(sql`${event_details_search_list.start_date} >= ${filter.startDate}`);
    }

    if (filter?.endDate) {
        query = query.where(sql`${event_details_search_list.end_date} <= ${filter.endDate}`);
    }

    // Apply organizer_user_id filter
    if (filter?.organizer_user_id) {
        query = query.where(eq(event_details_search_list.organizer_user_id, filter.organizer_user_id));
    }

    // Apply event_ids filter
    if (filter?.event_ids) {
        query = query.where(sql`${event_details_search_list.event_id} = any(${filter.event_ids})`);
    }

    // Apply event_uuids filter
    if (filter?.event_uuids) {
        query = query.where(sql`${event_details_search_list.event_uuid} = any(${filter.event_uuids})`);
    }

    // Apply search filters
    if (search) {
        const processedSearch = search.split(' ').join(' & ');
        query = query.where(
            or(
                sql`to_tsvector('pg_catalog.simple', ${event_details_search_list.title}) @@ to_tsquery('pg_catalog.simple', ${processedSearch})`,
                sql`to_tsvector('pg_catalog.simple', ${event_details_search_list.organizer_first_name}) @@ to_tsquery('pg_catalog.simple', ${processedSearch})`,
                sql`to_tsvector('pg_catalog.simple', ${event_details_search_list.organizer_last_name}) @@ to_tsquery('pg_catalog.simple', ${processedSearch})`,
                sql`to_tsvector('pg_catalog.simple', ${event_details_search_list.location}) @@ to_tsquery('pg_catalog.simple', ${processedSearch})`
            )
        );
        // Use rank for sorting when search is applied
        query = query.orderBy(sql`ts_rank_cd(setweight(to_tsvector('pg_catalog.simple', ${event_details_search_list.title}), 'A') || 
                                  setweight(to_tsvector('pg_catalog.simple', ${event_details_search_list.organizer_first_name}), 'B') || 
                                  setweight(to_tsvector('pg_catalog.simple', ${event_details_search_list.organizer_last_name}), 'C') || 
                                  setweight(to_tsvector('pg_catalog.simple', ${event_details_search_list.location}), 'D'), 
                          to_tsquery('pg_catalog.simple', ${processedSearch})) desc`);
    }

    // Apply additional sorting
    if (sortBy === "start_date_asc") {
        query = query.orderBy(asc(event_details_search_list.start_date));
    } else if (sortBy === "start_date_desc") {
        query = query.orderBy(desc(event_details_search_list.start_date));
    } else if (sortBy === "most_people_reached") {
        query = query.orderBy(desc(event_details_search_list.visitor_count));
    } else {
        query = query.orderBy(desc(event_details_search_list.created_at));
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);
    logSQLQuery(query.toSQL().sql, query.toSQL().params);
    // Execute the query
    const eventsData = await query.execute();

    console.log("*****eventsData", eventsData);

    // Cache the result
    setCache(cacheKey, eventsData, 60);

    return eventsData;
};