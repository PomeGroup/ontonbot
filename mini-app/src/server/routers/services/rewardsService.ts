import {
  addVisitor,
  getVisitor,
  selectValidVisitorById,
} from "@/server/db/visitors";
import rewardDB from "@/server/db/rewards.db";
import { getEventByUuid } from "@/server/db/events";
import { TRPCError } from "@trpc/server";
import { createUserRewardLink } from "@/lib/ton-society-api";
import { throwTRPCError } from "@/server/utils/utils";
import eventService from "@/server/routers/services/eventService";
import telegramService from "@/server/routers/services/telegramService";

// Main function to create a reward for a user
const createUserRewardSBT = async (props: {
  user_id: number;
  event_uuid: string;
  ticketOrderUuid?: string | null;
}) => {
  const { user_id, event_uuid, ticketOrderUuid = null } = props;
  let reward = null;
  try {
    // Validate the visitor
    // Fetch the event data
    const eventData = await getEventByUuid(event_uuid, false);

    // Check for a valid activity ID
    if(!eventData)
    {
      throwTRPCError(
          "NOT_FOUND",
          `Event not found with the provided event UUID: ${event_uuid}.`
      );
      return;
    }
    if (!eventData.activity_id || eventData.activity_id < 0) {
      throwTRPCError(
        "BAD_REQUEST",
        `This event does not have a valid activity ID: ${eventData.activity_id} for event UUID: ${event_uuid}.`
      );
      return;
    }
    if(!eventData)
    {
      throwTRPCError(
        "NOT_FOUND",
        `Event not found with the provided event UUID: ${event_uuid}.`
      );
      return;
    }

    // Validate event dates
    // try {
    //   eventService.validateEventDates(
    //       eventData.start_date || 0,
    //       eventData.end_date || 0
    //   );
    // } catch (dateError) {
    //   throwTRPCError(
    //       "BAD_REQUEST",
    //       `Invalid event dates: ${(dateError as Error).message}`
    //   );
    //   return;
    // }

    const visitor = !ticketOrderUuid
      ? await getVisitor(user_id, event_uuid)
      : await addVisitor(user_id, event_uuid);
    console.log("visitor", ticketOrderUuid, visitor);
    if (!visitor || !visitor?.id) {
      throwTRPCError(
        "NOT_FOUND",
        `Visitor not found with the provided user ID : ${user_id} and event UUID ${event_uuid}.`
      );
      return;
    }

    if (!ticketOrderUuid) {
      const isValidVisitor = await selectValidVisitorById(visitor.id);
      if (!isValidVisitor.length) {
        throwTRPCError(
          "BAD_REQUEST",
          "Invalid visitor: please complete the tasks."
        );
        return;
      }
      // Check if the user already owns the reward
      reward = await rewardDB.checkExistingReward(visitor.id);
      if (reward) {
        throwTRPCError(
          "CONFLICT",
          `User with ID ${user_id} already received reward for event ${event_uuid}.`
        );
        return;
      }
    } else {
      reward = await rewardDB.insert(
        visitor.id,
        null,
        user_id,
        "ton_society_sbt",
        "created_by_ui"
      );
    }
    // Process reward creation
    const createRewardResult = await rewardService.processRewardCreation(
      visitor.id,
      eventData,
      user_id,
      reward
    );
    if(createRewardResult.success) {
      await telegramService.sendRewardNotification(
          createRewardResult.data,
          visitor,
          eventData
      );
      return {reward: createRewardResult.data, visitor: visitor, event: eventData};
    }
    else {
      throwTRPCError(
          "CONFLICT",
           createRewardResult.error
      );
      return;
    }
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error; // If it's already a TRPCError, rethrow it
    }

    // For any other error, log it and throw a generic INTERNAL_SERVER_ERROR
    console.error(`Error in createUserRewardSBT:`, error);
    throwTRPCError(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while creating the user reward."
    );
  }
};

// Function to process reward creation
const processRewardCreation = async (
  visitor_id: number,
  eventData: any,
  user_id: number,
  reward: any
) => {

  try {
    const res = await createUserRewardLink(eventData.activity_id, {
      telegram_user_id: user_id,
      attributes: eventData.society_hub
        ? [{ trait_type: "Organizer", value: eventData.society_hub }]
        : undefined,
    });

    if (!res?.data?.data?.reward_link) {
      // Update the status in the database to put it in the cron job queue
      await rewardDB.updateStatusById(visitor_id, "created");
      return { success: false , data : null , error : `Failed to create user reward link: ${res}` };
    }
    else {
      // Update reward in the database
      reward = await rewardDB.updateRewardById(reward.id, {
        status: "notified_by_ui",
        data: res.data.data,
        updatedBy: "system",
      });
      return { success: true , data : reward, error : null };
    }

  } catch (error) {
     return { success: false , data : null , error : error };
  }
};

const rewardService = {
  createUserRewardSBT,
  processRewardCreation,
};

export default rewardService;
