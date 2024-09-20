import { db } from "@/db/db";
import {
  eventFields,
  events,
  rewards,
  tickets,
  userEventFields,
  users,
  visitors,
} from "@/db/schema";
import { and, between, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { checkEventTicketToCheckIn } from "@/server/db/events";
const findVisitorByUserAndEvent = async (
    user_id: number,
    event_uuid: string
) => {
    const visitorsFound = await db
        .select()
        .from(visitors)
        .where(
            and(eq(visitors.user_id, user_id), eq(visitors.event_uuid, event_uuid))
        )
        .execute();
    console.log("visitorsFound", visitorsFound);
    return visitorsFound?.[0] ?? null;
};
const insertNewVisitor = async (user_id: number, event_uuid: string) => {
    const insertedVisitor = await db
        .insert(visitors)
        .values({
            user_id: user_id,
            event_uuid: event_uuid,
            updatedBy: "system",
        })
        .returning() // This ensures the inserted record is returned
        .execute();

    return insertedVisitor?.[0] ?? null;
};

const generateRandomVisitor = (userId: number) => ({
  user_id: userId,
  username: `user_${userId}`,
  first_name: `FirstName${userId}`,
  last_name: `LastName${userId}`,
  wallet_address: `0x${Math.random().toString(36).substring(2, 15)}`,
  created_at: new Date().toISOString(),
  dynamicFields: [
    {
      event_field_id: Math.trunc(Math.random() * 10000),
      data: `Sample data ${userId}`,
    },
  ],
});

export const selectVisitorsByEventUuidMock = async (
  event_uuid: string,
  limit: number,
  cursor: number
) => {
  const visitorsData = Array.from({ length: limit }, (_, index) =>
    generateRandomVisitor(cursor + index + 1)
  );

  const moreRecordsAvailable = visitorsData.length === limit; // Simulate the possibility of more records

  return {
    visitorsWithDynamicFields: visitorsData,
    moreRecordsAvailable,
    nextCursor: moreRecordsAvailable ? cursor + limit : null,
  };
};

export const selectValidVisitorById = async (visitorId: number) => {
  return db
    .select({
      user_id: visitors.user_id,
      username: users.username,
      first_name: users.first_name,
      last_name: users.last_name,
      wallet_address: users.wallet_address,
      created_at: visitors.created_at,
    })
    .from(visitors)
    .leftJoin(users, eq(visitors.user_id, users.user_id))
    .leftJoin(events, eq(events.event_uuid, visitors.event_uuid))
    .where(
      and(
        eq(visitors.id, visitorId),
        isNotNull(events.start_date),
        isNotNull(events.end_date),
        isNotNull(users.wallet_address),
        between(
          visitors.last_visit,
          sql`TO_TIMESTAMP(events.start_date)`,
          sql`TO_TIMESTAMP(events.end_date)`
        ),
        eq(
          db
            .select({ count: sql`count(*)`.mapWith(Number) })
            .from(userEventFields)
            .where(
              and(
                eq(userEventFields.user_id, visitors.user_id),
                eq(userEventFields.completed, true),
                eq(userEventFields.event_id, events.event_id)
              )
            ),
          db
            .select({ count: sql`count(*)`.mapWith(Number) })
            .from(eventFields)
            .where(and(eq(eventFields.event_id, events.event_id)))
        )
      )
    );
};

export const selectVisitorsByEventUuid = async (
  event_uuid: string,
  limit?: number,
  cursor?: number,
  dynamic_fields: boolean = true,
  search?: string
) => {
  const eventTicketToCheckIn = await checkEventTicketToCheckIn(event_uuid);
  let userDataQuery;
  if (eventTicketToCheckIn.ticketToCheckIn === false) {
    userDataQuery = db
      .select({
        user_id: visitors.user_id,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        wallet_address: users.wallet_address,
        created_at: visitors.created_at,
        has_ticket: sql<boolean>`false`.as("has_ticket"),
        ticket_status: sql<string>`null`.as("ticket_status"),
        ticket_id: sql<number>`null`.as("ticket_id"),
      })
      .from(visitors)
      .leftJoin(users, eq(visitors.user_id, users.user_id))
      .leftJoin(rewards, eq(visitors.id, rewards.visitor_id))
      .where(
        and(
          isNotNull(rewards.id),
          eq(visitors.event_uuid, event_uuid),
          search
            ? or(
                ilike(users.username, `%${search}%`),
                ilike(users.first_name, `%${search}%`),
                ilike(users.last_name, `%${search}%`)
              )
            : sql`true`
        )
      )
      .orderBy(desc(visitors.created_at));
  } else {
    userDataQuery = db
      .select({
        user_id: users.user_id,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        wallet_address: users.wallet_address,
        created_at: tickets.created_at,
        has_ticket: sql<boolean>`true`.as("has_ticket"),
        ticket_status: tickets.status,
        ticket_id: tickets.id,
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.user_id, users.user_id))
      .where(
        and(
          eq(tickets.event_uuid, event_uuid),
          search
            ? or(
                ilike(users.username, `%${search}%`),
                ilike(users.first_name, `%${search}%`),
                ilike(users.last_name, `%${search}%`)
              )
            : sql`true`
        )
      )

      .orderBy(desc(tickets.created_at));
  }

  if (typeof limit === "number" && limit > 0) {
    userDataQuery = userDataQuery.limit(limit);
  }

  if (typeof cursor === "number") {
    userDataQuery = userDataQuery.offset(cursor);
  }

  const visitorsData = await userDataQuery.execute();

  const moreRecordsAvailable =
    typeof limit === "number" ? visitorsData.length === limit : false;
  const nextCursor =
    moreRecordsAvailable && typeof cursor === "number" ? cursor + limit! : null;
  if (!dynamic_fields) {
    return {
      visitorsWithDynamicFields: null,
      moreRecordsAvailable,
      visitorsData,
      nextCursor,
    };
  }
  let userEventFieldsData = await db
    .select({
      user_id: userEventFields.user_id,
      event_field_id: userEventFields.event_field_id,
      data: userEventFields.data,
      title: eventFields.title,
    })
    .from(userEventFields)
    .leftJoin(eventFields, eq(userEventFields.event_field_id, eventFields.id))
    .leftJoin(events, eq(eventFields.event_id, events.event_id))
    .where(eq(events.event_uuid, event_uuid));

  const visitorsWithDynamicFields = visitorsData.map((visitor) => {
    const dynamicFields = userEventFieldsData
      .filter((field) => field.user_id === visitor.user_id)
      .map((field) => ({
        event_field_id: field.event_field_id,
        data: field.data,
      }));

    return {
      ...visitor,
      dynamicFields,
    };
  });

  return {
    visitorsWithDynamicFields,
    moreRecordsAvailable,
    visitorsData,
    nextCursor,
  };
};

export const updateVisitorLastVisit = async (id: number) => {
  return db
    .update(visitors)
    .set({
      last_visit: sql`now()`,
      updatedBy: "system",
    })
    .where(eq(visitors.id, id));
};

// Function to get visitor by user_id and event_uuid
export const getVisitor = async (user_id: number, event_uuid: string) => {
   db.query.visitors.findFirst({
    where(fields, { eq, and }) {
      return and(
        eq(fields.user_id, user_id),
        eq(fields.event_uuid, event_uuid)
      );
    },
  });
};
// Function to add a new visitor
export const addVisitor = async (user_id: number, event_uuid: string) => {
  try {
    // Check if the visitor already exists
    const existingVisitor = await findVisitorByUserAndEvent(
      user_id,
      event_uuid
    );
    if (existingVisitor) {
        console.log("existingVisitor", existingVisitor);
      return  existingVisitor; // Visitor already exists, no need to add
    }
    // Insert new visitor
    return await insertNewVisitor(user_id, event_uuid);
  } catch (error) {
    console.error("Error adding visitor:", error);
    throw new Error("Failed to add visitor.");
  }
};
