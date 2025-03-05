import rewardDB from "@/server/db/rewards.db";

import { createUserRewardLink } from "@/lib/ton-society-api";
import { getAndValidateVisitor } from "@/server/routers/services/visitorService";

import { db } from "@/db/db";
import rewardsDb from "@/server/db/rewards.db";
import visitorsDB, { addVisitor, findVisitorByUserAndEventUuid, selectValidVisitorById } from "@/server/db/visitors";
import { validateEventData, validateEventDates } from "@/server/routers/services/eventService";
import { sendRewardNotification } from "@/server/routers/services/telegramService";
import { TRPCError } from "@trpc/server";
import { eventRegistrants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import eventDB, { selectEventByUuid } from "@/server/db/events";
import { logger } from "@/server/utils/logger";
import { sleep } from "@/utils";
import eventPaymentDB from "@/server/db/eventPayment.db";

//TODO - Put this in db functions files
async function getRegistrantRequest(event_uuid: string, user_id: number) {
  const result = (
    await db
      .select()
      .from(eventRegistrants)
      .where(and(eq(eventRegistrants.event_uuid, event_uuid), eq(eventRegistrants.user_id, user_id)))
      .execute()
  ).pop();

  return result;
}

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
    if (!eventValidationResult.success || !eventData || !eventData.start_date || !eventData.end_date) {
      return eventValidationResult; // Return the error in JSON format
    }

    // validate event date
    const validateEventDateResult = validateEventDates(eventData.start_date, eventData.end_date);
    if (!validateEventDateResult.success) {
      return validateEventDateResult;
    }

    // Validate visitor
    const visitorValidationResult = await getAndValidateVisitor(user_id, event_uuid, ticketOrderUuid);
    // logger.log("visitorValidationResult", visitorValidationResult);
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
    const createRewardResult = await processRewardCreation(eventData, user_id, visitor);
    // logger.log("createRewardResult", createRewardResult);
    // If reward creation was successful
    if (createRewardResult?.success) {
      reward = createRewardResult.data;
      // Send notification to the user
      if (reward?.status === "created") {
        const notificationResult = await sendRewardNotification(createRewardResult.data, visitor, eventData, reward);

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
    // logger.error(`Error in createUserRewardSBT:`, error);
    // Return a JSON response for any unexpected errors
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
      errorCode: "INTERNAL_SERVER_ERROR",
      data: null,
    };
  }
};

// Function to process reward creation
export const processRewardCreation = async (eventData: any, user_id: number, visitor: any) => {
  let reward;
  reward = await rewardDB.insert(visitor.id, null, user_id, "ton_society_sbt", "pending_creation");

  try {
    // Call the function to create a user reward link

    const res = await createUserRewardLink(eventData.activity_id, {
      telegram_user_id: user_id,
      attributes: eventData.society_hub ? [{ trait_type: "Organizer", value: eventData.society_hub }] : undefined,
    });

    // Ensure the result is successful and has the expected data structure
    if (res.data?.data?.reward_link) {
      // Update reward in the database with status "created"
      reward = await rewardDB.updateRewardById(reward.id, {
        status: "created",
        data: { ...res.data.data, ok: true },
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
    // logger.error("Error in processRewardCreation:", error);
    return {
      success: false,
      data: reward,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const createUserReward = async (
  props: { user_id: number; event_uuid?: string; event_id?: number },
  force: boolean = false
) => {
  try {
    if (!props.event_uuid && !props.event_id) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "event UUID or event id is required." });
    }

    let eventData = null;
    if (props.event_uuid) {
      eventData = await eventDB.selectEventByUuid(props.event_uuid);
    } else if (props.event_id) {
      eventData = await db.query.events.findFirst({
        where(fields, { eq }) {
          return eq(fields.event_id, props.event_id!);
        },
      });
    }

    const event_uuid = eventData?.event_uuid!;
    if (!eventData || !event_uuid) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "event not found." });
    }
    /* -------------------------------------------------------------------------- */
    /*                              Fetch the visitor                             */
    /* -------------------------------------------------------------------------- */
    let visitor = null;
    if (force) {
      //Force Add Visitor
      visitor = await addVisitor(props.user_id, event_uuid);
    } else {
      // Find the Visitor
      visitor = await findVisitorByUserAndEventUuid(props.user_id, event_uuid);
    }

    // Check if visitor exists
    if (!visitor)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Visitor not found with the provided user ID and event UUID.",
      });

    /* -------------------------------------------------------------------------- */

    /* -------------------------------------------------------------------------- */
    /*                            1. Validate the visitor                            */
    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */
    /*                               2. Only For Online(Not Forced)                              */
    /* -------------------------------------------------------------------------- */
    const isValidVisitor = await selectValidVisitorById(visitor.id);
    if (!isValidVisitor.length && eventData?.participationType === "online" && !force) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid visitor: please complete the tasks.",
      });
    }

    const reward = await rewardDB.findRewardByVisitorId(visitor.id);
    if (reward?.data?.ok) {
      return {
        reward_link: reward.data?.reward_link,
      };
    }

    if (!eventData?.activity_id || eventData.activity_id < 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `this event does not have an activity id ${eventData?.activity_id}`,
      });
    }

    if (eventData.has_registration) {
      const eventRegistrantRequest = await getRegistrantRequest(event_uuid, props.user_id);

      if (!eventRegistrantRequest) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Event with registration and user is not approved`,
        });
      } else if (eventRegistrantRequest.status !== "approved" && eventData.participationType == "online") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Online Event with registration needs approval`,
        });
      } else if (eventRegistrantRequest.status !== "approved" && eventData.participationType == "in_person") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `In-Person Event with registration needs approval`,
        });
      }
    }

    const startDate = Number(eventData.start_date) * 1000;
    const endDate = Number(eventData.end_date) * 1000;

    if (Date.now() < startDate || Date.now() > endDate) {
      throw new TRPCError({
        message: "Event is ended/not started",
        code: "FORBIDDEN",
      });
    }

    try {
      // Create the user reward link
      const society_hub_value =
        typeof eventData.society_hub === "string" ? eventData.society_hub : eventData.society_hub?.name || "Onton";

      const res = await createUserRewardLink(eventData.activity_id, {
        telegram_user_id: props.user_id,
        attributes: eventData?.society_hub
          ? [
              {
                trait_type: "Organizer",
                value: society_hub_value,
              },
            ]
          : undefined,
      });

      // Ensure the response contains data
      if (!res || !res.data || !res.data.data) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Failed to create user reward link.",
        });
      }

      // Insert the reward into the database
      await rewardsDb.insertRewardWithData(
        visitor.id,
        props.user_id.toString(),
        "ton_society_sbt",
        res.data.data,
        force ? "created" : "notified_by_ui"
      );

      return res.data.data;
    } catch (error) {
      // logger.error("error ehile creating reward link", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      // Ensure the response contains data
      throw new TRPCError({
        code: "CONFLICT",
        message: "Failed to create user reward link.",
        cause: error,
      });
    }
  } catch (error) {
    // logger.error("Error in createUserReward mutation:", error);
    if (error instanceof TRPCError) {
      throw error;
    } else {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while creating user reward.",
      });
    }
  }
};

/**
 * Creates a CSBT ticket reward for the given user/event.
 * 1) Checks if there's an existing reward; if so, returns immediately
 * 2) Looks up the eventPayment row to ensure it's TSCSBT + has a ticket_activity_id
 * 3) Calls createUserRewardLink(ticket_activity_id, ...)
 * 4) Inserts the new reward into the DB
 */
export async function CsbtTicket(event_uuid: string, user_id: number) {
  // 1) Create (or fetch) a visitor record for this user + event
  const visitor = await addVisitor(user_id, event_uuid);

  // 2) Fetch the main event (for organizer/society_hub info, etc.)
  const eventData = await selectEventByUuid(event_uuid);
  if (!eventData) {
    logger.error("CsbtTicketRewardService: eventData is null");
    throw new Error("CsbtTicketRewardService: eventData is null");
  }

  // 3) Fetch the eventPayment info to ensure TSCSBT + ticket_activity_id
  const paymentInfo = await eventPaymentDB.fetchPaymentInfoForCronjob(event_uuid);

  if (!paymentInfo) {
    logger.error(`CsbtTicketRewardService: No payment info found for event ${event_uuid}`);
    throw new Error(`No payment info found for event ${event_uuid}`);
  }
  if (paymentInfo.ticket_type !== "TSCSBT") {
    logger.error(`CsbtTicketRewardService: Event is not TSCSBT ${event_uuid}`);
    throw new Error("Event is not TSCSBT");
  }
  if (!paymentInfo.ticketActivityId) {
    logger.error(`CsbtTicketRewardService: Missing ticket_activity_id for TSCSBT event ${event_uuid}`);
    throw new Error("Missing ticket_activity_id for TSCSBT event");
  }

  // 4) Check if a reward already exists for this visitor
  const existingReward = await rewardDB.checkExistingRewardWithType(visitor.id, "ton_society_csbt_ticket");
  if (existingReward) {
    logger.debug(`Reward already exists for visitor ${visitor.id}, skipping creation`);
    return;
  }

  // 5) Build optional trait for "Organizer"
  const societyHubValue =
    typeof eventData.society_hub === "string" ? eventData.society_hub : eventData.society_hub?.name || "Onton";

  const attributes =
    eventData.society_hub && societyHubValue ? [{ trait_type: "Organizer", value: societyHubValue }] : undefined;

  // 6) Call Ton Society to create user reward link (using ticket_activity_id!)
  const res = await createUserRewardLink(paymentInfo.ticketActivityId, {
    telegram_user_id: user_id,
    attributes,
  });

  if (!res?.data?.data) {
    logger.error("Failed to create user reward link: response was empty");
    throw new Error("Failed to create user reward link.");
  }

  // 7) Insert the reward into the DB
  await rewardDB.insertRewardWithData(
    visitor.id,
    user_id.toString(),
    "ton_society_csbt_ticket", // Reward type
    res.data.data,
    "created"
  );

  logger.log(`CSBT Ticket reward created for user=${user_id}, event=${event_uuid}`);

  return res.data.data;
}

export const CsbtTicketForApi = async (event_uuid: string, user_id: number) => {
  // 1) Make sure there's a Visitor record
  const visitor = await visitorsDB.addVisitor(user_id, event_uuid);
  const eventData = await eventDB.selectEventByUuid(event_uuid);
  if (!eventData || !eventData.activity_id) {
    logger.error("CsbtTicketRewardService eventData or activity_id is null");
    // In a normal CsbtTicket, we'd throw. But let's do so here as well:
    throw new Error("CsbtTicketRewardService eventData or activity_id is null");
  }

  // 2) Check if a reward already exists for this visitor
  const existingReward = await rewardDB.checkExistingReward(visitor.id);
  if (existingReward) {
    // If there's already a reward, we do nothing further
    logger.info(`Reward already exists for visitor ${visitor.id}, skipping creation.`);
    return existingReward.data; // Return the existing reward data
  }

  // Prepare the "Organizer" trait
  const society_hub_value =
    typeof eventData.society_hub === "string" ? eventData.society_hub : eventData.society_hub?.name || "Onton";

  while (true) {
    // Brief delay between attempts to avoid spamming the API
    await sleep(20);

    try {
      // 4) Call your external API to create the user reward link
      const response = await createUserRewardLink(eventData.activity_id, {
        telegram_user_id: user_id,
        attributes: [
          {
            trait_type: "Organizer",
            value: society_hub_value,
          },
        ],
      });

      // Make sure it's valid
      if (!response?.data?.data) {
        throw new Error("Failed to create user reward link: No 'data' returned.");
      }

      // 5) Insert the newly created reward into your DB
      await rewardsDb.insertRewardWithData(visitor.id, user_id.toString(), "ton_society_sbt", response.data.data, "created");

      logger.info(`CSBT Ticket created successfully for user ${user_id}.`);
      return response.data.data; // Return the reward link data
    } catch (error) {
      try {
        await rewardsDb.insertRewardWithData(
          visitor.id,
          user_id.toString(),
          "ton_society_sbt",
          null, // no reward link data
          "pending_creation" // custom status
        );
      } catch (insertErr) {
        // If even that fails, just log it
        logger.error("Error inserting pending creation reward record", insertErr);
      }
    }
  }
};

const rewardService = {
  createUserRewardSBT,
  processRewardCreation,
  createUserReward,
  CsbtTicketForApi,
};

export default rewardService;
