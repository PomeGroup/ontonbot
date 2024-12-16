import { db } from "@/db/db";
import { eventRegistrants, notifications } from "@/db/schema";
import { and, eq, not, inArray, asc, gt, ne } from "drizzle-orm";

export const fetchApprovedUsers = async (
  eventUuid: string,
  triggerId: number,
  lastUserId: number,
  pageSize: number

): Promise<{ userId: number }[]> => {
  try {
    const approvedUsers = await db
      .select({ userId: eventRegistrants.user_id })
      .from(eventRegistrants)
      .where(
        and(
          eq(eventRegistrants.event_uuid, eventUuid),
          eq(eventRegistrants.status, "approved"),
          // Exclude users who have already been sent a notification for this trigger
          not(
            inArray(
              eventRegistrants.user_id,
              db
                .select({ userId: notifications.userId })
                .from(notifications)
                .where(and(eq(notifications.item_type, "POA_TRIGGER"), eq(notifications.itemId, triggerId) , ne(notifications.status, "REPLIED")))
            )
          ),
          // Keyset pagination: fetch users with ID greater than the last processed ID
          gt(eventRegistrants.user_id, lastUserId)
        )
      )
      .limit(pageSize)
      .orderBy(asc(eventRegistrants.user_id)) // Correct usage of asc
      .execute();

    return approvedUsers as { userId: number }[];
  } catch (error) {
    console.error(`Error fetching approved users for Event UUID ${eventUuid} and Trigger ID ${triggerId}:`, error);
    throw error; // Propagate the error to be handled by the caller
  }
};
export const getByEventUuidAndUserId = async (eventUuid: string, userId: number) => {
  try {
    const result = await db
      .select()
      .from(eventRegistrants)
      .where(and(eq(eventRegistrants.event_uuid, eventUuid), eq(eventRegistrants.user_id, userId)))
      .execute();
    return result[0];
  } catch (error) {
    console.error(`Error fetching Event Registrant for Event UUID ${eventUuid} and User ID ${userId}:`, error);
    throw error; // Propagate the error to be handled by the caller
  }
};
export const eventRegistrantsDB = {
  fetchApprovedUsers,
  getByEventUuidAndUserId,
};
