import { db } from "@/db/db";
import { rewards } from "@/db/schema/rewards";
import { RewardType, RewardStatus } from "@/db/enum";
import { TRPCError } from "@trpc/server";

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
    type: RewardType,  // Use the RewardType enum
    status: RewardStatus  // Use the RewardStatus enum
) => {
    try {
        return await db
            .insert(rewards)
            .values({
                visitor_id,
                type: type,
                data: data,
                status: status,
                updatedBy: user_id.toString(),  // Convert user_id to string
            })
            .execute();
    } catch (error) {
        console.error("Error inserting reward:", error);
        const errorMessage = `Failed to insert reward for visitor_id: ${visitor_id}, user_id: ${user_id}, type: ${type}, status: ${status}`;

        // Throw error with additional debugging information
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage,
            cause: error,  // Attach the original error for debugging
        });
    }
};

// Exporting as an object so you can call rewardDB.insert, rewardDB.checkExistingReward
const rewardDB = {
    checkExistingReward,
    insert,
};

export default rewardDB;
