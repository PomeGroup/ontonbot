import { db } from "@/db/db";
import { eventPoaTriggers,  EventTriggerStatus,EventTriggerType } from "@/db/schema";
import { redisTools } from "@/lib/redisTools";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// Cache key prefix for event POA triggers
const getEventPoaCacheKey = (poaId: number) => `${redisTools.cacheKeys.eventPoaTrigger}${poaId}`;

// Add a new event POA trigger
export const addEventPoaTrigger = async (poaData: {
  eventId: number;
  poaOrder: number;
  startTime: number;
  countOfSent: number;
  countOfSuccess: number;
  poaType: EventTriggerType; // "simple", "multiple_choice", or "question"
  status: EventTriggerStatus; // "active", "deactive", etc.
  createdAt?: Date;
  updatedAt?: Date;
}) => {
  try {
    const result = await db
      .insert(eventPoaTriggers)
      .values({
        eventId: poaData.eventId,
        poaOrder: poaData.poaOrder,
        startTime: poaData.startTime,
        countOfSent: poaData.countOfSent,
        countOfSuccess: poaData.countOfSuccess,
        poaType: poaData.poaType,
        status: poaData.status,
        createdAt: poaData.createdAt || new Date(),
        updatedAt: poaData.updatedAt || new Date(),
      })
      .onConflictDoNothing()
      .execute();

    console.log("POA Trigger added:", result);
    return result;
  } catch (error) {
    console.error("Error adding POA Trigger:", error);
    throw error;
  }
};

// Update the status of a POA trigger by ID
export const updateEventPoaStatus = async (poaId: number, newStatus:  EventTriggerStatus) => {
  try {
    await db
      .update(eventPoaTriggers)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(eventPoaTriggers.id, poaId))
      .execute();

    await redisTools.deleteCache(getEventPoaCacheKey(poaId)); // Clear cache
    console.log(`POA Trigger ${poaId} status updated to ${newStatus}`);
  } catch (error) {
    console.error("Error updating POA Trigger status:", error);
    throw error;
  }
};

// Increment the count of sent by ID
export const incrementCountOfSent = async (poaId: number, incrementBy = 1) => {
  try {
    // Execute raw SQL using sql tagged template
    await db.execute(
      sql`UPDATE ${eventPoaTriggers} 
          SET count_of_sent = count_of_sent + ${incrementBy}, updated_at = ${new Date()} 
          WHERE id = ${poaId}`
    );

    await redisTools.deleteCache(getEventPoaCacheKey(poaId)); // Clear cache
    console.log(`Incremented countOfSent for POA Trigger ${poaId}`);
  } catch (error) {
    console.error("Error incrementing countOfSent:", error);
    throw error;
  }
};

// Increment the count of success by ID
export const incrementCountOfSuccess = async (poaId: number, incrementBy = 1) => {
  try {
    // Execute raw SQL using sql tagged template
    await db.execute(
      sql`UPDATE ${eventPoaTriggers} 
          SET count_of_success = count_of_success + ${incrementBy}, updated_at = ${new Date()} 
          WHERE id = ${poaId}`
    );

    await redisTools.deleteCache(getEventPoaCacheKey(poaId)); // Clear cache
    console.log(`Incremented countOfSuccess for POA Trigger ${poaId}`);
  } catch (error) {
    console.error("Error incrementing countOfSuccess:", error);
    throw error;
  }
};

// Get a list of active POAs by time
export const getActivePoaByTime = async (startTime: number, endTime: number) => {
  try {
    const activePoas = await db
      .select()
      .from(eventPoaTriggers)
      .where(
        and(
          eq(eventPoaTriggers.status, "active"),
          gte(eventPoaTriggers.startTime, startTime),
          lte(eventPoaTriggers.startTime, endTime)
        )
      )
      .execute();

    console.log("Active POAs by time:", activePoas);
    return activePoas;
  } catch (error) {
    console.error("Error getting active POAs by time:", error);
    throw error;
  }
};

// Get POAs by event ID
export const getPoaByEventId = async (eventId: number) => {
  try {
    const cacheKey = `${redisTools.cacheKeys.eventPoaByEvent}${eventId}`;
    const cachedResult = await redisTools.getCache(cacheKey);

    if (cachedResult) {
      return cachedResult; // Return cached data if available
    }

    const poaTriggers = await db
      .select()
      .from(eventPoaTriggers)
      .where(eq(eventPoaTriggers.eventId, eventId))
      .execute();

    await redisTools.setCache(cacheKey, poaTriggers, redisTools.cacheLvl.short); // Cache the result
    console.log("POAs for event ID:", eventId, poaTriggers);
    return poaTriggers;
  } catch (error) {
    console.error("Error getting POAs by event ID:", error);
    throw error;
  }
};

// Export all functions in a single object
export const eventPoaTriggersDB = {
  addEventPoaTrigger,
  updateEventPoaStatus,
  incrementCountOfSent,
  incrementCountOfSuccess,
  getActivePoaByTime,
  getPoaByEventId,
};
