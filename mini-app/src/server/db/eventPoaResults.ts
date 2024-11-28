import { db } from "@/db/db";
import { eventPoaResults } from "@/db/schema";
import { redisTools } from "@/lib/redisTools";
import { eq, and } from "drizzle-orm";

// Cache key generator for POA results
const getPoaResultCacheKey = (userId: number, eventId: number) =>
  `${redisTools.cacheKeys.eventPoaResult}${userId}:${eventId}`;

// Get POA results by user ID and event ID
export const getPoaResultsByUserIdAndEventId = async (userId: number, eventId: number) => {
  try {
    const cacheKey = getPoaResultCacheKey(userId, eventId);
    const cachedResult = await redisTools.getCache(cacheKey);

    if (cachedResult) {
      return cachedResult; // Return cached data if available
    }

    const results = await db
      .select()
      .from(eventPoaResults)
      .where(and(eq(eventPoaResults.userId, userId), eq(eventPoaResults.eventId, eventId)))
      .execute();

    await redisTools.setCache(cacheKey, results, redisTools.cacheLvl.short); // Cache the result
    console.log(`POA Results for User ${userId} and Event ${eventId} retrieved:`, results);
    return results;
  } catch (error) {
    console.error("Error getting POA results by user ID and event ID:", error);
    throw error;
  }
};

// Get POA results by user ID, event ID, and status
export const getPoaResultsByUserIdEventIdAndStatus = async (
  userId: number,
  eventId: number,
  status: string
) => {
  try {
    const results = await db
      .select()
      .from(eventPoaResults)
      .where(
        and(
          eq(eventPoaResults.userId, userId),
          eq(eventPoaResults.eventId, eventId),
          eq(eventPoaResults.status, status)
        )
      )
      .execute();

    console.log(`POA Results for User ${userId}, Event ${eventId}, and Status "${status}" retrieved:`, results);
    return results;
  } catch (error) {
    console.error("Error getting POA results by user ID, event ID, and status:", error);
    throw error;
  }
};

// Get POA results by event ID
export const getPoaResultsByEventId = async (eventId: number) => {
  try {
    const cacheKey = `${redisTools.cacheKeys.eventPoaResultsByEvent}${eventId}`;
    const cachedResult = await redisTools.getCache(cacheKey);

    if (cachedResult) {
      return cachedResult; // Return cached data if available
    }

    const results = await db
      .select()
      .from(eventPoaResults)
      .where(eq(eventPoaResults.eventId, eventId))
      .execute();

    await redisTools.setCache(cacheKey, results, redisTools.cacheLvl.short); // Cache the result
    console.log(`POA Results for Event ${eventId} retrieved:`, results);
    return results;
  } catch (error) {
    console.error("Error getting POA results by event ID:", error);
    throw error;
  }
};

// Export all functions as a single object
export const eventPoaResultsDB = {
  getPoaResultsByUserIdAndEventId,
  getPoaResultsByUserIdEventIdAndStatus,
  getPoaResultsByEventId,
};
