import { db } from "@/db/db";
import { rewards } from "@/db/schema/rewards";
import { RewardType, RewardStatus } from "@/db/enum";
import { eq } from "drizzle-orm";

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

const rewardDB = {
  checkExistingReward,
  insert,
  updateStatusById,
  updateRewardById,
};

export default rewardDB;
