import { db } from "@/db/db";
import { rewards } from "@/db/schema/rewards";
import { RewardType, RewardStatus } from "@/db/enum";
import {eq, sql} from "drizzle-orm";
import {visitors} from "@/db/schema";

// Function to check if a reward already exists for a visitor
const checkExistingReward = (visitor_id: number) => {
  return db.query.rewards.findFirst({
    where(fields, { eq }) {
      return eq(fields.visitor_id, visitor_id);
    },
  });
};

// Function to insert a reward for a visitor
const insert = async (
  visitor_id: number,
  data: any,
  user_id: number,
  type: RewardType, // Use the RewardType enum
  status: RewardStatus // Use the RewardStatus enum
) => {
  const result = await db
    .insert(rewards)
    .values({
      visitor_id,
      type: type,
      data: data,
      status: status,
      updatedBy: user_id.toString(), // Convert user_id to string
    })
    .returning()
    .execute();

  return result[0];
};
const updateStatusById = async (visitor_id: number, status: RewardStatus) => {
  const updatedVisitor = await db
    .update(rewards)
    .set({
      status: status,
      updatedBy: "system", // You can track who updated the record
    })
    .where(eq(rewards.visitor_id, visitor_id))
    .returning() // Ensures the updated record is returned
    .execute();

  return updatedVisitor?.[0] ?? null; // Return the updated visitor or null if not found
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
      ...updateFields, // Spread the update fields to dynamically update the table
      updatedBy: updateFields.updatedBy ?? "system", // Default to "system" if not provided
      updatedAt: new Date(), // Always update `updatedAt` field
    })
    .where(eq(rewards.id, reward_id)) // Update based on reward ID (UUID)
    .returning() // Ensures the updated record is returned
    .execute();

  return updatedReward?.[0] ?? null; // Return the updated reward or null if not found
};
const updateReward = async (reward_id: string, data: any) => {
    return await rewardDB.updateRewardById(reward_id, {
        status: "created",          // Setting status to 'created'
        data: data,                 // Data passed as a parameter
        updatedBy: "system",        // Updated by 'system'
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
const insertReward = async (
  visitor_id: number,
  user_id: string,
  status: RewardStatus,
  type: RewardType
) => {
  return await db
    .insert(rewards)
    .values({
      status: status, // Status as a parameter
      type: type, // Type as a parameter
      visitor_id: visitor_id, // Visitor ID as a parameter
      updatedBy: user_id, // Updated by user ID as a parameter
    })
    .execute();
};

const findRewardByVisitorId = async (visitor_id: number) => {
    return db.query.rewards.findFirst({
        where(fields, { eq }) {
            return eq(fields.visitor_id, visitor_id);
        },
    });
};

const selectRewardsWithVisitorDetails = async (userId: number) => {
    return await db
        .select({
            event_uuid: visitors.event_uuid,
            user_id: visitors.user_id,
            role: sql<string>`'participant'`.as("role"),  // Static role as 'participant'
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
            status: shouldFail ? "failed" : undefined,                            // Set status to 'failed' if shouldFail is true
            data: shouldFail ? { fail_reason: error } : undefined,               // Set fail_reason if shouldFail is true
            updatedBy: "system",                                                 // Updated by 'system'
        })
        .where(eq(rewards.id, reward_id))                                      // Update based on reward ID
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
