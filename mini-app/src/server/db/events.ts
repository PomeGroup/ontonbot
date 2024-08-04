import { db } from "@/db/db";
import { eventFields, events, users } from "@/db/schema";
import { removeKey } from "@/lib/utils";
import { validateMiniAppData } from "@/utils";
import { and, eq } from "drizzle-orm";

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
