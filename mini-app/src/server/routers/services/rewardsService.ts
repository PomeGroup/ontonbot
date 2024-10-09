import rewardDB from "@/server/db/rewards.db";

import { getAndValidateVisitor } from "@/server/routers/services/visitorService";
import { createUserRewardLink } from "@/lib/ton-society-api";

import {
  validateEventData,
  validateEventDates,
} from "@/server/routers/services/eventService";
import { sendRewardNotification } from "@/server/routers/services/telegramService";

// Main function to create a reward for a user
export const createUserRewardSBT = async (props: {
  user_id: number;
  event_uuid: string;
  ticketOrderUuid?: string | null;
}) => {
  const { user_id, event_uuid, ticketOrderUuid = null } = props;
  let reward = null;

  try {
    // Validate event data
    const eventValidationResult = await validateEventData(event_uuid);
    const eventData = eventValidationResult?.data;
    if (
      !eventValidationResult.success ||
      !eventData ||
      !eventData.start_date ||
      !eventData.end_date
    ) {
      return eventValidationResult; // Return the error in JSON format
    }

    // validate event date
    const validateEventDateResult = validateEventDates(eventData.start_date, eventData.end_date);
    if (!validateEventDateResult.success) {
      return validateEventDateResult;
    }

    // Validate visitor
    const visitorValidationResult = await getAndValidateVisitor(
      user_id,
      event_uuid,
      ticketOrderUuid
    );
    console.log("visitorValidationResult", visitorValidationResult);
    if (!visitorValidationResult.success || !visitorValidationResult.data) {
      return visitorValidationResult; // Return the error in JSON format
    }
    const visitor = visitorValidationResult.data;
    // Check if reward already exists

    reward = await rewardDB.checkExistingReward(visitor.id);
    if (reward) {
      return {
        success: false,
        error: `User with ID ${user_id} already received reward for event ${event_uuid}.`,
        errorCode: "CONFLICT",
        data: null,
      };
    }

    // Process reward creation
    const createRewardResult = await processRewardCreation(
      eventData,
      user_id,
      visitor
    );
    console.log("createRewardResult", createRewardResult);
    // If reward creation was successful
    if (createRewardResult?.success) {
      reward = createRewardResult.data;
      // Send notification to the user
      if (reward?.status === "created") {
        const notificationResult = await sendRewardNotification(
          createRewardResult.data,
          visitor,
          eventData
        );

        // If notification was sent successfully, update the reward status
        if (notificationResult.success) {
          reward = await rewardDB.updateRewardById(reward.id, {
            status: "notified_by_ui",
            updatedBy: "system",
          });
        }
      }
      return { success: true, data: reward, error: null };
    }

    // If reward creation failed, return error
    return {
      success: false,
      error: createRewardResult?.error || "Reward creation failed.",
      errorCode: "CONFLICT",
      data: null,
    };
  } catch (error) {
    console.error(`Error in createUserRewardSBT:`, error);
    // Return a JSON response for any unexpected errors
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      errorCode: "INTERNAL_SERVER_ERROR",
      data: null,
    };
  }
};

// Function to process reward creation
export const processRewardCreation = async (
  eventData: any,
  user_id: number,
  visitor: any
) => {
  let reward;
  reward = await rewardDB.insert(
    visitor.id,
    null,
    user_id,
    "ton_society_sbt",
    "pending_creation"
  );

  try {
    // Call the function to create a user reward link

    const res = await createUserRewardLink(eventData.activity_id, {
      telegram_user_id: user_id,
      attributes: eventData.society_hub
        ? [{ trait_type: "Organizer", value: eventData.society_hub }]
        : undefined,
    });

    // Ensure the result is successful and has the expected data structure
    if (res.status && res.data && res.data.data?.reward_link) {
      // Update reward in the database with status "created"
      reward = await rewardDB.updateRewardById(reward.id, {
        status: "created",
        data: res.data,
        updatedBy: "system",
      });

      return { success: true, data: reward, error: null };
    }

    // If it fails, return an appropriate failure response
    return {
      success: false,
      data: reward,
      error: "Reward link creation failed.",
    };
  } catch (error) {
    // Catch any unexpected errors and return a failure response
    console.error("Error in processRewardCreation:", error);
    return {
      success: false,
      data: reward,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const rewardService = {
  createUserRewardSBT,
  processRewardCreation,
};

export default rewardService;
