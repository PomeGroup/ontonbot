// get by id

import { db } from "@/db/db";
import { eventFields } from "@/db/schema/eventFields";
import { and, eq } from "drizzle-orm";

const getEventFields = async (event_id: number) => {
  return await db
    .select()
    .from(eventFields)
    .where(and(eq(eventFields.id, event_id)))
    .execute();
};
// Function to insert event field
const insertEventField = async (
  trx: typeof db, // Transaction context type
  eventFieldData: {
    emoji: string;
    title: string;
    description: string;
    placeholder: string | undefined;
    type: string;
    order_place: number;
    event_id: number;
    updatedBy: string;
  }
) => {
  await trx.insert(eventFields).values(eventFieldData).execute();
};

// Function to update an event field
const updateEventFieldLog = async (
  trx: typeof db,
  fieldId: number,
  updatedBy: string
) => {
  await trx
    .update(eventFields)
    .set({
      updatedBy: updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(eventFields.id, fieldId))
    .execute();
};

// Function to select event fields by event ID
const selectEventFieldsByEventId = async (trx: typeof db, eventId: number) => {
  return await trx
    .select()
    .from(eventFields)
    .where(eq(eventFields.event_id, eventId))
    .execute();
};

// Function to delete an event field by its ID
const deleteEventFieldById = async (
  trx: typeof db,
  fieldId: number,
  eventId: number
) => {
  return await trx
    .delete(eventFields)
    .where(and(eq(eventFields.id, fieldId), eq(eventFields.event_id, eventId)))
    .execute();
};

// Upsert (update or insert) event field based on field existence
const upsertEventField = async (
  trx: typeof db,
  field: any,
  index: number,
  userId: string,
  eventId: number
) => {
  const fieldData = {
    emoji: field.emoji,
    title: field.title,
    description: field.description,
    placeholder: field.type === "button" ? field.url : field.placeholder,
    type: field.type,
    order_place: index,
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (field.id) {
    // Update the existing field
    await trx
      .update(eventFields)
      .set(fieldData)
      .where(eq(eventFields.id, field.id))
      .execute();
  } else {
    // Insert a new field
    await trx
      .insert(eventFields)
      .values({
        ...fieldData,
        event_id: eventId, // Include event ID for new records
      })
      .execute();
  }
};

// Function to handle dynamic fields
const handleDynamicFields = async (
  trx: typeof db,
  eventData: any,
  userId: string,
  eventId: number
) => {
  const dynamicFields = eventData.dynamic_fields.filter(
    (f: any) => f.title !== "secret_phrase_onton_input"
  );

  for (const [index, field] of dynamicFields.entries()) {
    await upsertEventField(trx, field, index, userId, eventId);
  }
};
// export module
const eventFieldsDB = {
  getEventFields,
  insertEventField,
  updateEventFieldLog,
  selectEventFieldsByEventId,
  deleteEventFieldById,
  upsertEventField,
  handleDynamicFields,
};
export default eventFieldsDB;
