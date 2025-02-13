import { db } from "@/db/db";
import { usersScore, UsersScoreActivityType, UserScoreItemType } from "@/db/schema/usersScore";
import { and, eq, sql } from "drizzle-orm";
import { logger } from "@/server/utils/logger";

/**
 * Create a new usersScore record.
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
    return result;
  } catch (error) {
    logger.error("Error creating UserScore:", error);
    throw error;
  }
};

/**
 * Change the status (active flag) of a usersScore record by its ID.
 */
export const changeUserScoreStatus = async (id: number, newStatus: boolean) => {
  try {
    await db.update(usersScore).set({ active: newStatus }).where(eq(usersScore.id, id)).execute();
    logger.log(`UserScore ${id} status changed to ${newStatus}`);
  } catch (error) {
    logger.error("Error changing UserScore status:", error);
    throw error;
  }
};

/**
 * Update the point (score) of a usersScore record by its ID.
 */
export const updateUserScore = async (id: number, newPoint: number) => {
  try {
    await db.update(usersScore).set({ point: newPoint }).where(eq(usersScore.id, id)).execute();
    logger.log(`UserScore ${id} point updated to ${newPoint}`);
  } catch (error) {
    logger.error("Error updating UserScore:", error);
    throw error;
  }
};

/**
 * Get the total score for a user by summing the points of all records
 * with the given userId.
 */
export const getTotalScoreByUserId = async (userId: number) => {
  try {
    const result = await db
      .select({
        total: sql<number>`COALESCE
            (SUM(${usersScore.point}), 0)`,
      })
      .from(usersScore)
      .where(eq(usersScore.userId, userId))
      .execute();
    const total = result[0]?.total || 0;
    return total;
  } catch (error) {
    logger.error("Error getting total score by user id:", error);
    throw error;
  }
};

/**
 * Get the total score for a user filtered by a specific activity type.
 */
export const getTotalScoreByActivityTypeAndUserId = async (userId: number, activityType: UsersScoreActivityType) => {
  try {
    const result = (
      await db
        .select({
          total: sql<number>`COALESCE
              (SUM(${usersScore.point}), 0)`,
        })
        .from(usersScore)
        .where(and(eq(usersScore.userId, userId), eq(usersScore.activityType, activityType)))
        .execute()
    ).pop();
    const total = result?.total || 0;
    return total;
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
