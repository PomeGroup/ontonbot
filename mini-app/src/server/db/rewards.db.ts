import { db } from "@/db/db";
import { RewardStatus, RewardType } from "@/db/enum";
import { RewardTonSocietyStatusType, visitors } from "@/db/schema";
import { RewardType as RewardTypeParitial } from "@/types/event.types";

import { RewardDataTyepe, rewards, RewardsSelectType } from "@/db/schema/rewards";
import { redisTools } from "@/lib/redisTools";
import { Maybe } from "@trpc/server";
import { and, eq, sql, or, asc } from "drizzle-orm";
import { logger } from "@/server/utils/logger";

export interface RewardChunkRow {
  reward_id: string; // or `uuid` type depending on your schema
  visitor_id: number;
}

// Utility function to generate cache keys
const generateCacheKey = (visitor_id: number, reward_id?: string) => {
  return `reward:${visitor_id}${reward_id ? `:${reward_id}` : ""}`;
};

const generateCacheKeyForLinkEvent = (event_uuid: string) => {
  return `reward:link:${event_uuid}`;
};
// Function to check if a reward already exists for a visitor
const checkExistingReward = async (visitor_id: number): Promise<Maybe<RewardsSelectType>> => {
  const cacheKey = generateCacheKey(visitor_id);
  const cachedReward = await redisTools.getCache(cacheKey);
  if (cachedReward) return cachedReward; // Return from cache if exists

  const dbReward = await db.query.rewards.findFirst({
    where(fields, { eq }) {
      return eq(fields.visitor_id, visitor_id);
    },
  });

  if (dbReward) await redisTools.setCache(cacheKey, dbReward, redisTools.cacheLvl.long); // Cache the result

  return dbReward;
};

const checkExistingRewardWithType = async (visitor_id: number, type: RewardType): Promise<Maybe<RewardsSelectType>> => {
  const dbReward = await db.query.rewards.findFirst({
    where(fields, { eq }) {
      return and(eq(fields.visitor_id, visitor_id), eq(fields.type, type));
    },
  });

  return dbReward;
};

// Function to insert a reward for a visitor
const insert = async (visitor_id: number, data: any, user_id: number, type: RewardType, status: RewardStatus) => {
  const visitor = await db.query.visitors.findFirst({
    where: (fields, ops) => {
      return ops.eq(fields.id, visitor_id);
    },
  });

  const event = await db.query.events.findFirst({
    where: (fields, ops) => {
      return ops.eq(fields.event_uuid, visitor?.event_uuid!);
    },
  });

  const result = await db
    .insert(rewards)
    .values({
      visitor_id,
      type: type,
      data: data,
      event_end_date: event?.end_date!,
      event_start_date: event?.start_date!,
      status: status,
      updatedBy: user_id.toString(),
    })
    .returning()
    .execute();

  const cacheKey = generateCacheKey(visitor_id);
  await redisTools.setCache(cacheKey, result[0], redisTools.cacheLvl.long); // Cache the inserted reward
  return result[0];
};

const updateStatusById = async (visitor_id: number, status: RewardStatus) => {
  const updatedVisitor = await db
    .update(rewards)
    .set({
      status: status,
      updatedBy: "system",
    })
    .where(eq(rewards.visitor_id, visitor_id))
    .returning()
    .execute();

  const cacheKey = generateCacheKey(visitor_id);
  await redisTools.setCache(cacheKey, updatedVisitor?.[0], redisTools.cacheLvl.medium); // Update cache
  return updatedVisitor?.[0] ?? null;
};

const updateRewardById = async (
  reward_id: string,
  updateFields: Partial<{
    visitor_id: number;
    type: RewardType;
    data: RewardDataTyepe;
    tryCount: number;
    status: RewardStatus;
    updatedBy: string;
  }>
) => {
  const updatedReward = await db
    .update(rewards)
    .set({
      ...updateFields,
      updatedBy: updateFields.updatedBy ?? "system",
      updatedAt: new Date(),
    })
    .where(eq(rewards.id, reward_id))
    .returning()
    .execute();

  if (updateFields.visitor_id) {
    const cacheKey = generateCacheKey(updateFields.visitor_id, reward_id);
    await redisTools.setCache(cacheKey, updatedReward?.[0], redisTools.cacheLvl.long); // Update cache for specific reward
  }

  return updatedReward?.[0] ?? null;
};
const updateReward = async (reward_id: string, data: any) => {
  return await rewardDB.updateRewardById(reward_id, {
    status: "created", // Setting status to 'created'
    data: data, // Data passed as a parameter
    updatedBy: "system", // Updated by 'system'
  });
};
const insertRewardWithData = async (
  visitor_id: number,
  user_id: string,
  type: RewardType,
  data: any,
  status: RewardStatus
) => {
  return await rewardDB.insert(
    visitor_id,
    data, // Data from response or any other source
    Number(user_id), // Convert user_id to number if necessary
    type, // Type as a parameter (e.g., "ton_society_sbt")
    status // Status as a parameter (e.g., "notified_by_ui")
  );
};
const insertReward = async (visitor_id: number, user_id: string, status: RewardStatus, type: RewardType) => {
  const visitor = await db.query.visitors.findFirst({
    where: (fields, ops) => {
      return ops.eq(fields.id, visitor_id);
    },
  });

  const event = await db.query.events.findFirst({
    where: (fields, ops) => {
      return ops.eq(fields.event_uuid, visitor?.event_uuid!);
    },
  });

  return await db
    .insert(rewards)
    .values({
      status: status, // Status as a parameter
      type: type, // Type as a parameter
      event_end_date: event?.end_date!,
      event_start_date: event?.start_date!,
      visitor_id: visitor_id, // Visitor ID as a parameter
      updatedBy: user_id, // Updated by user ID as a parameter
    })
    .execute();
};

const findRewardByVisitorId = async (visitor_id: number) => {
  return await checkExistingReward(visitor_id);
};

const selectRewardsWithVisitorDetails = async (userId: number) => {
  return await db
    .select({
      event_uuid: visitors.event_uuid,
      user_id: visitors.user_id,
      role: sql<string>`'participant'`.as("role"), // Static role as 'participant'
      created_at: visitors.created_at,
    })
    .from(rewards)
    .innerJoin(visitors, eq(visitors.id, rewards.visitor_id))
    .where(eq(visitors.user_id, userId))
    .execute();
};
const updateRewardWithConditions = async (
  reward_id: string,
  isEventPublished: boolean,
  pendingReward: { tryCount: number; id: string },
  shouldFail: boolean,
  error?: string
) => {
  return await db
    .update(rewards)
    .set({
      tryCount: isEventPublished ? pendingReward.tryCount + 1 : undefined, // Increment tryCount if event is published
      status: shouldFail ? "failed" : undefined, // Set status to 'failed' if shouldFail is true
      data: shouldFail && error ? { fail_reason: error, ok: false } : null, // Set fail_reason if shouldFail is true
      updatedBy: "system", // Updated by 'system'
    })
    .where(eq(rewards.id, reward_id)) // Update based on reward ID
    .execute();
};

const updateTonSocietyStatusByVisitorId = async (visitor_id: number, newTonSocietyStatus: RewardTonSocietyStatusType) => {
  // Perform the update
  const updatedVisitor = await db
    .update(rewards)
    .set({
      tonSocietyStatus: newTonSocietyStatus,
      updatedBy: "system",
    })
    .where(eq(rewards.visitor_id, visitor_id))
    .returning()
    .execute();

  // Update the cache with the new record
  const cacheKey = generateCacheKey(visitor_id);
  await redisTools.setCache(cacheKey, updatedVisitor?.[0], redisTools.cacheLvl.medium);

  // Return the first updated row, or null if none
  return updatedVisitor?.[0] ?? null;
};

/**
 * Fetch a chunk of rewards for a given event_uuid where
 * tonSocietyStatus is "NOT_CLAIMED".
 */
export async function fetchNotClaimedRewardsForEvent(
  event_uuid: string,
  limit: number,
  offset: number
): Promise<RewardChunkRow[]> {
  return await db
    .select({
      reward_id: rewards.id,
      visitor_id: rewards.visitor_id,
    })
    .from(rewards)
    .innerJoin(sql`visitors as v`, eq(sql`v.id`, rewards.visitor_id))
    .where(and(eq(sql`v.event_uuid`, event_uuid), eq(rewards.tonSocietyStatus, "NOT_CLAIMED")))
    .orderBy(sql`${rewards.id} ASC`)
    .limit(limit)
    .offset(offset)
    .execute();
}

const updateRewardStatus = async (
  rewardId: string,
  status?: string,
  options?: {
    tryCount: number;
    data: any;
  }
) => {
  const reward = (await db.select().from(rewards).where(eq(rewards.id, rewardId)))[0];

  await db
    .update(rewards)
    .set({
      status,
      ...(options?.data && {
        ...(typeof reward?.data === "object" && reward.data),
        ...options.data,
      }),
      tryCount: options?.tryCount,
      updatedBy: "system",
      updatedAt: new Date(),
    })
    .where(eq(rewards.id, rewardId));
};

const handleRewardError = async (reward: RewardTypeParitial, error: any) => {
  const shouldFail = reward.tryCount >= 10;
  const newStatus = shouldFail ? "notification_failed" : undefined;
  const newData = shouldFail ? { fail_reason: error.message } : undefined;

  try {
    await rewardDB.updateRewardStatus(reward.id, newStatus, {
      tryCount: reward.tryCount + 1,
      data: newData,
    });
  } catch (dbError) {
    logger.error("DB_ERROR", dbError);
  }
};

/**
 * Fetch pending rewards for a specific event, in a paginated (offset/limit) manner.
 */
export const fetchPendingRewardsForEvent = async (
  eventUuid: string,
  limit: number,
  offset: number
): Promise<RewardTypeParitial[]> =>
  db.query.rewards.findMany({
    where: (fields, { eq, and, inArray }) =>
      and(
        eq(fields.status, "pending_creation"),
        inArray(fields.visitor_id, db.select({ id: visitors.id }).from(visitors).where(eq(visitors.event_uuid, eventUuid)))
      ),
    limit,
    offset,
    orderBy: [asc(rewards.created_at)],
  });

/**
 * Finds the first visitor for the given eventUuid,
 * then returns the first "created" reward linked to that visitor.
 *
 * Returns `RewardTypeParitial` if found, otherwise `null`.
 */
export const fetchRewardLinkForEvent = async (eventUuid: string): Promise<RewardTypeParitial | null> => {
  const cacheKey = generateCacheKeyForLinkEvent(eventUuid);
  const cachedReward = await redisTools.getCache(cacheKey);
  if (cachedReward) {
    return cachedReward;
  }
  // 1) Find a single visitor for the given eventUuid
  const singleVisitor = await db.query.visitors.findFirst({
    where: (fields, { eq }) => eq(fields.event_uuid, eventUuid),
    orderBy: [asc(visitors.created_at)], // or your preferred sorting
  });
  if (!singleVisitor) {
    // If no visitor found, return null
    return null;
  }

  // 2) Using that visitor's ID, find one reward with status "created"
  //    Return `null` if not found
  const reward = await db.query.rewards.findFirst({
    where: (fields, { eq, and }) =>
      and(or(eq(fields.status, "created"), eq(fields.status, "notified")), eq(fields.visitor_id, singleVisitor.id)),
    orderBy: [asc(rewards.created_at)],
  });
  if (reward) {
    await redisTools.setCache(cacheKey, reward, redisTools.cacheLvl.short);
  }
  // 3) Convert `undefined` to `null` for TypeScript consistency
  return reward ?? null;
};
const rewardDB = {
  checkExistingReward,
  insert,
  updateStatusById,
  updateRewardById,
  insertReward,
  insertRewardWithData,
  findRewardByVisitorId,
  selectRewardsWithVisitorDetails,
  updateReward,
  updateRewardWithConditions,
  updateTonSocietyStatusByVisitorId,
  fetchNotClaimedRewardsForEvent,
  updateRewardStatus,
  handleRewardError,
  fetchPendingRewardsForEvent,
  fetchRewardLinkForEvent,
  checkExistingRewardWithType,
};

export default rewardDB;
