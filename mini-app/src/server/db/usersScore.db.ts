import { db } from "@/db/db";
import { usersScore, UsersScoreActivityType, UserScoreItemType, activityTypesArray } from "@/db/schema/usersScore";
import { and, eq, sql } from "drizzle-orm";
import { redisTools } from "@/lib/redisTools";
import { logger } from "@/server/utils/logger";

export type TotalScoreByActivityTypeAndUserId = {
  total: number;
  count: number;
};

// Cache key helpers
const getTotalScoreByUserIdCacheKey = (userId: number) => `${redisTools.cacheKeys.usersScore}total:${userId}`;
const getTotalScoreByActivityTypeAndUserIdCacheKey = (userId: number, activityType: UsersScoreActivityType) =>
  `${redisTools.cacheKeys.usersScore}${activityType}:${userId}`;

const invalidateUserScoreCache = async (userId: number) => {
  await redisTools.deleteCache(getTotalScoreByUserIdCacheKey(userId));

  for (const type of activityTypesArray) {
    await redisTools.deleteCache(getTotalScoreByActivityTypeAndUserIdCacheKey(userId, type));
  }
};
/**
 * Create a new usersScore record.
 * After insertion, invalidate all cached scores for the user.
 */
export const createUserScore = async (scoreData: {
  userId: number;
  activityType: UsersScoreActivityType;
  point: number;
  active: boolean;
  itemId: number;
  itemType: UserScoreItemType;
}) => {
  try {
    const result = await db
      .insert(usersScore)
      .values({
        userId: scoreData.userId,
        activityType: scoreData.activityType,
        point: scoreData.point,
        active: scoreData.active,
        itemId: scoreData.itemId,
        itemType: scoreData.itemType,
        createdAt: new Date().toISOString(),
      })
      .returning();
    logger.log("UserScore created:", result);

    // Invalidate cache
    await invalidateUserScoreCache(scoreData.userId);

    return result;
  } catch (error) {
    logger.error("Error creating UserScore:", error);
    throw error;
  }
};

/**
 * Change the status (active flag) of a usersScore record by its ID.
 */
export const changeUserScoreStatus = async (id: number, newStatus: boolean, userId: number) => {
  try {
    await db
      .update(usersScore)
      .set({ active: newStatus })
      .where(and(eq(usersScore.id, id), eq(usersScore.userId, userId)))
      .execute();
    // Invalidate cache
    await invalidateUserScoreCache(userId);
    logger.log(`UserScore ${id} status changed to ${newStatus}`);
  } catch (error) {
    logger.error("Error changing UserScore status:", error);
    throw error;
  }
};

/**
 * Update the point (score) of a usersScore record by its ID.
 */
export const updateUserScore = async (id: number, newPoint: number, userId: number) => {
  try {
    await db
      .update(usersScore)
      .set({ point: newPoint })
      .where(and(eq(usersScore.id, id), eq(usersScore.userId, userId)))
      .execute();
    // Invalidate cache
    await invalidateUserScoreCache(userId);
    logger.log(`UserScore ${id} point updated to ${newPoint}`);
  } catch (error) {
    logger.error("Error updating UserScore:", error);
    throw error;
  }
};

/**
 * Get the total score for a user by summing the points of all records
 * with the given userId. Uses Redis caching.
 */
export const getTotalScoreByUserId = async (userId: number): Promise<number> => {
  try {
    const cacheKey = getTotalScoreByUserIdCacheKey(userId);
    const cachedResult = await redisTools.getCache(cacheKey);
    if (cachedResult !== null && cachedResult !== undefined) {
      return cachedResult as number;
    }

    const result = (
      await db
        .select({
          total: sql<number>`COALESCE
              (SUM(${usersScore.point}), 0)`,
        })
        .from(usersScore)
        .where(eq(usersScore.userId, userId))
        .execute()
    ).pop();

    const total = result?.total || 0;
    await redisTools.setCache(cacheKey, total, redisTools.cacheLvl.short);
    return total;
  } catch (error) {
    logger.error("Error getting total score by user id:", error);
    throw error;
  }
};

/**
 * Get the total score for a user filtered by a specific activity type.
 * Uses Redis caching.
 */
export const getTotalScoreByActivityTypeAndUserId = async (
  userId: number,
  activityType: UsersScoreActivityType
): Promise<TotalScoreByActivityTypeAndUserId> => {
  try {
    const cacheKey = getTotalScoreByActivityTypeAndUserIdCacheKey(userId, activityType);
    const cachedResult = await redisTools.getCache(cacheKey);
    if (cachedResult !== null && cachedResult !== undefined) {
      return cachedResult as TotalScoreByActivityTypeAndUserId;
    }

    const result = (
      await db
        .select({
          total: sql<number>`COALESCE
              (SUM(${usersScore.point}), 0)`,
          count: sql<number>`COUNT
              (${usersScore.point})`,
        })
        .from(usersScore)
        .where(and(eq(usersScore.userId, userId), eq(usersScore.activityType, activityType)))
        .execute()
    ).pop();

    const data: TotalScoreByActivityTypeAndUserId = result || { total: 0, count: 0 };
    await redisTools.setCache(cacheKey, data, redisTools.cacheLvl.short);
    return data;
  } catch (error) {
    logger.error("Error getting total score by activity type and user id:", error);
    throw error;
  }
};

export const usersScoreDB = {
  createUserScore,
  changeUserScoreStatus,
  updateUserScore,
  getTotalScoreByUserId,
  getTotalScoreByActivityTypeAndUserId,
};
