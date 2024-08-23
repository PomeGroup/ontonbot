import { db } from "@/db/db";
import {
  event_details_search_list,
  eventFields,
  events,
  rewards,
  users,
  visitors,
} from "@/db/schema";
import { cacheKeys, getCache, setCache } from "@/lib/cache";
import { logSQLQuery } from "@/lib/logSQLQuery";
import { removeKey } from "@/lib/utils";
import { validateMiniAppData } from "@/utils";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { unionAll } from "drizzle-orm/pg-core";

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

export const  getUserEvents =async(
  userId: number | null,
  limit: number | 100,
  offset: number | 0
)=> {
  const rewardQuery = db
    .select({
      event_uuid: visitors.event_uuid,
      user_id: visitors.user_id,
      role: sql<string>`"participant"`.as("role"),
      created_at: visitors.created_at,
    })
    .from(rewards)
    .leftJoin(visitors, eq(visitors.id, rewards.visitor_id))
    .where(userId !== null ? eq(visitors.user_id, userId!) : undefined);

  const eventQuery = db
    .select({
      event_uuid: events.event_uuid,
      user_id: users.user_id,
      role: users.role,
      created_at: events.created_at,
    })
    .from(events)
    .innerJoin(users, eq(events.owner, users.user_id))
    .where(userId !== null ? eq(users.user_id, userId!) : undefined);

  // Use unionAll to combine the results, apply orderBy, limit, and offset
  const combinedResultsQuery = unionAll(rewardQuery, eventQuery)
    .orderBy((row) => row.created_at)
    .limit(limit !== null ? limit : 100)
    .offset(offset !== null ? offset : 0);

  // Execute the query and return the results
  return await combinedResultsQuery.execute();
}

export const getEventsWithFilters = async (
  params: z.infer<typeof searchEventsInputZod>
): Promise<any[]> => {
  const { limit = 10, offset = 0, search, filter, sortBy = "default" } = params;
  //console.log("*****params", params);

  const cacheKey =
    cacheKeys.getEventsWithFilters +
    JSON.stringify({ limit, offset, search, filter, sortBy });

  const cachedResult = getCache(cacheKey);
  // if (cachedResult) {
  //   console.log("Returning cached result");
  //   return cachedResult;
  // }

  let query = db.select().from(event_details_search_list);

  // Initialize an array to hold the conditions
  let conditions = [];

  // Apply event type filters
  if (filter?.participationType?.length) {
    conditions.push(
      or(
        filter.participationType.includes("online")
          ? eq(event_details_search_list.participationType, "online")
          : sql`false`,
        filter.participationType.includes("in_person")
          ? eq(event_details_search_list.participationType, "in_person")
          : sql`false`
      )
    );
  }

  // Apply date filters
  console.log(filter);
  if (filter?.startDate && filter?.startDateOperator) {
    conditions.push(
      sql`${event_details_search_list.startDate} ${sql.raw(filter.startDateOperator)} ${filter.startDate}`
    );
  }

  if (filter?.endDate && filter?.endDateOperator) {
    conditions.push(
      sql`${event_details_search_list.endDate} ${sql.raw(filter.endDateOperator)} ${filter.endDate}`
    );
  }

  // Apply hidden condition
  conditions.push(sql`${event_details_search_list.hidden} = ${false}`);

  // Apply organizer_user_id filter
  if (filter?.organizer_user_id) {
    conditions.push(
      eq(event_details_search_list.organizerUserId, filter.organizer_user_id)
    );
  }

  // Apply event_ids filter
  if (filter?.event_ids) {
    conditions.push(
      sql`${event_details_search_list.eventId} = any(${filter.event_ids})`
    );
  }
  // Apply society_hub_id filter
  if (filter?.society_hub_id) {
    conditions.push(
      inArray(event_details_search_list.societyHubID, filter.society_hub_id)
    );
  }
  // Apply event_uuids filter
  if (filter?.event_uuids) {
    conditions.push(
      inArray(event_details_search_list.eventUuid, filter.event_uuids)
    );
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
    if (sortBy === "start_date_asc" || sortBy === "default") {
      orderByClause = sql`start_date ASC`;
    } else if (sortBy === "start_date_desc") {
      orderByClause = sql`start_date DESC`;
    } else if (sortBy === "most_people_reached") {
      orderByClause = sql`visitor_count DESC`;
    }

    // @ts-expect-error
    query = query.orderBy(
      sql`greatest(
                similarity(${event_details_search_list.title}, ${search}),
                similarity(${event_details_search_list.location}, ${search})
            ) DESC ${orderByClause ? sql`, ${orderByClause}` : sql``}`
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
    }
  }

  // Apply pagination
  // @ts-expect-error
  query = query.limit(limit).offset(offset);
  logSQLQuery(query.toSQL().sql, query.toSQL().params);
  const eventsData = await query.execute();
  // console.log(eventsData);
  setCache(cacheKey, eventsData, 60);
  return eventsData;
};
