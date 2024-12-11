import { db } from "@/db/db";
import { RewardStatus, RewardType } from "@/db/enum";
import { visitors } from "@/db/schema";
import { rewards, RewardsSelectType } from "@/db/schema/rewards";
import { redisTools } from "@/lib/redisTools";
import { Maybe } from "@trpc/server";
import { eq, sql } from "drizzle-orm";

// Utility function to generate cache keys
const generateCacheKey = (visitor_id: number, reward_id?: string) => {
  return `reward:${visitor_id}${reward_id ? `:${reward_id}` : ""}`;
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
    data: Record<string, any>;
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
const insertRewardWithData = async (visitor_id: number, user_id: string, type: RewardType, data: any, status: RewardStatus) => {
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
      data: shouldFail ? { fail_reason: error } : undefined, // Set fail_reason if shouldFail is true
      updatedBy: "system", // Updated by 'system'
    })
    .where(eq(rewards.id, reward_id)) // Update based on reward ID
    .execute();
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
};

export default rewardDB;
