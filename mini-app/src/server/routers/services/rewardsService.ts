import { getVisitor, selectValidVisitorById } from "@/server/db/visitors";
import { checkExistingReward } from "@/server/db/rewards";
import { getEventByUuid } from "@/server/db/events";
import { TRPCError } from "@trpc/server";
import { createUserRewardLink } from "@/lib/ton-society-api";
import { db } from "@/db/db";
import { rewards } from "@/db/schema/rewards";
import { throwTRPCError } from "@/server/utils/utils";

const rewardService = {
  // Function to validate event dates
  validateEventDates: (start_date: number, end_date: number) => {
    const currentTime = Date.now();
    const startDate = start_date * 1000;
    const endDate = end_date * 1000;

    if (currentTime < startDate || currentTime > endDate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Either the event has not started or it has already ended.",
      });
    }
  },

  // Main function to create a reward for a user
  createUserRewardSBT: async (props: {
    wallet_address: string;
    user_id: number;
    event_uuid: string;
  }) => {
    try {
      // Fetch the visitor from the database
      const visitor = await getVisitor(props.user_id, props.event_uuid);
      if (!visitor || !visitor.id) {
        throwTRPCError(
          "NOT_FOUND",
          "Visitor not found with the provided user ID and event UUID."
        );
        return;
      }

      // Validate the visitor
      const isValidVisitor = await selectValidVisitorById(visitor.id);
      if (!isValidVisitor.length) {
        throwTRPCError(
          "BAD_REQUEST",
          "Invalid visitor: please complete the tasks."
        );
        return;
      }

      // Check if the user already owns the reward
      const reward = await checkExistingReward(visitor.id);
      if (reward) {
        throwTRPCError(
          "CONFLICT",
          `User with ID ${props.user_id} already received reward for event ${props.event_uuid}.`
        );
        return;
      }

      // Fetch the event data
      const eventData = await getEventByUuid(props.event_uuid);

      // Check for a valid activity ID
      if (!eventData.activity_id || eventData.activity_id < 0) {
        throwTRPCError(
          "BAD_REQUEST",
          `This event does not have a valid activity ID: ${eventData.activity_id}`
        );
        return;
      }

      // Validate event dates
      try {
        rewardService.validateEventDates(
          eventData.start_date || 0,
          eventData.end_date || 0
        );
      } catch (dateError) {
        throwTRPCError(
          "BAD_REQUEST",
          `Invalid event dates: ${(dateError as Error).message}`
        );
        return;
      }

      // Process reward creation
      return await rewardService.processRewardCreation(
        visitor.id,
        eventData,
        props.user_id
      );
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
  },

  // Function to process reward creation
  processRewardCreation: async (
    visitor_id: number,
    eventData: any,
    user_id: number
  ) => {
    try {
      const res = await createUserRewardLink(eventData.activity_id, {
        telegram_user_id: user_id,
        attributes: eventData.society_hub
          ? [{ trait_type: "Organizer", value: eventData.society_hub }]
          : undefined,
      });

      if (!res?.data?.data) {
        throwTRPCError("CONFLICT", "Failed to create user reward link.");
        return;
      }

      // Insert reward into the database
      await db
        .insert(rewards)
        .values({
          visitor_id,
          type: "ton_society_sbt",
          data: res.data.data,
          status: "notified_by_ui",
          updatedBy: user_id.toString(),
        })
        .execute();

      return res.data.data;
    } catch (error) {
      console.error("Error during reward creation:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user reward.",
      });
    }
  },
};

export default rewardService;
