import { z } from "zod";
import { logger } from "@/server/utils/logger";
import eventDB from "@/server/db/events";
import { eventRegistrants, orders } from "@/db/schema";
import { db } from "@/db/db";
import ordersDB from "@/server/db/orders.db";
import { usersDB } from "@/server/db/users";
import { OrderTypeValues } from "@/db/schema/orders";
import rewardService from "@/server/routers/services/rewardsService";
import { PaymentTypes } from "@/db/enum";
import rewardDB from "@/server/db/rewards.db";

/* -------------------------------------------------------------------------- */
/*                           Zod Schema Definition                            */
/* -------------------------------------------------------------------------- */
const verifiedAsPaidSchema = z.object({
  telegramUserId: z.number(),
  telegramUsername: z.string().min(1),
  eventUuid: z.string().uuid(),
  paymentType: z.enum(["STAR", "TON", "USDT"]),
  paymentAmount: z.number().positive(),
});

/* -------------------------------------------------------------------------- */
/*                          Helper / Utility Functions                        */

/* -------------------------------------------------------------------------- */

/**
 * Validate & parse the request body using Zod schema
 */
const parseAndValidateRequest = async (request: Request) => {
  const rawBody = await request.json();
  const parseResult = verifiedAsPaidSchema.safeParse(rawBody);

  if (!parseResult.success) {
    throw {
      status: 400,
      errorBody: {
        success: false,
        status: "bad_request",
        message: "Invalid request body",
        errors: parseResult.error.flatten(),
      },
    };
  }
  return parseResult.data; // { telegramUserId, telegramUsername, eventUuid, paymentType, paymentAmount }
};

/**
 * Fetch event data and validate ownership & activity.
 * Throws structured errors if checks fail.
 */
const fetchAndValidateEvent = async (eventUuid: string, eventOwnerId: number) => {
  const eventData = await eventDB.selectEventByUuid(eventUuid);

  if (!eventData) {
    throw {
      status: 404,
      errorBody: {
        success: false,
        message: "Event not found",
        status: "event_not_exist",
      },
    };
  }

  // Check if the authenticated user is the owner
  if (eventData.owner !== eventOwnerId) {
    throw {
      status: 401,
      errorBody: { message: "Unauthorized Access to event" },
    };
  }

  // Check if event is published
  if (!eventData.activity_id) {
    throw {
      status: 410,
      errorBody: {
        success: false,
        message: "Event not published yet",
        status: "event_not_active",
      },
    };
  }

  return eventData;
};

/**
 * Fetch payment info for the event, determine ticket order type,
 * and optionally check if the event is sold out.
 */
const fetchPaymentInfoAndCheckSoldOut = async (eventUuid: string, eventData: any) => {
  const eventPaymentInfo = await db.query.eventPayment.findFirst({
    where(fields, { eq }) {
      return eq(fields.event_uuid, eventUuid);
    },
  });

  if (!eventPaymentInfo) {
    throw {
      status: 404,
      errorBody: {
        success: false,
        message: "Event payment info does not exist",
        status: "event_not_exist",
      },
    };
  }

  // Suppose eventPaymentInfo.ticket_type is either "NFT" or "TSCSBT"
  const ticketOrderTypeMap = {
    NFT: "nft_mint",
    TSCSBT: "ts_csbt_ticket",
  } as const;

  const eventTicketingType = eventPaymentInfo.ticket_type as keyof typeof ticketOrderTypeMap;
  const orderType = ticketOrderTypeMap[eventTicketingType] ?? "nft_mint";

  // Check if sold out
  const { isSoldOut } = await ordersDB.checkIfSoldOut(eventUuid, orderType, eventData.capacity || 0);
  if (isSoldOut) {
    throw {
      status: 410,
      errorBody: {
        success: false,
        message: "Event tickets are sold out",
        status: "sold_out",
      },
    };
  }

  return orderType;
};

/**
 * Insert or update user if needed, based on telegramUserId.
 */
const ensureUserExists = async (telegramUserId: number, telegramUsername: string) => {
  const existingUser = await usersDB.selectUserById(telegramUserId);
  if (existingUser) return existingUser;

  // Insert user if not found
  const initDataJson = {
    user: {
      id: telegramUserId,
      username: telegramUsername.replace("@", ""),
      first_name: "PaymentFlow",
      last_name: "",
      language_code: "en",
      is_premium: false,
      allows_write_to_pm: false,
      photo_url: undefined,
    },
  };

  const addedOrFoundUser = await usersDB.insertUser(initDataJson);
  if (!addedOrFoundUser) {
    logger.error("Failed to insert/find user in verifaiedAsPaid", initDataJson);
    throw {
      status: 400,
      errorBody: {
        success: false,
        message: "Failed to insert user",
        status: "user_insert_failed",
      },
    };
  }

  return addedOrFoundUser;
};

/**
 * If there's an existing-completed order, attempt to fetch or generate TSCSBT link
 */
const handleExistingOrder = async (
  existingOrder: any,
  eventUuid: string,
  telegramUserId: number,
  isOntonUser: boolean,
  orderType: string
) => {
  let existingRewardLink = `https://onton.app/claim/${existingOrder.uuid}`;

  if (orderType === "ts_csbt_ticket") {
    try {
      const linkData = await rewardService.CsbtTicketForApi(eventUuid, telegramUserId);

      if (
        linkData &&
        typeof linkData === "object" &&
        "reward_link" in (linkData as Record<string, unknown>) &&
        typeof (linkData as { reward_link?: unknown }).reward_link === "string"
      ) {
        existingRewardLink = (linkData as { reward_link: string }).reward_link || existingRewardLink;
      }
    } catch (err) {
      logger.error("Failed to create or fetch existing TSCSBT link", err);
    }
  }

  // Return a success Response
  return new Response(
    JSON.stringify({
      success: true,
      isOntonUser,
      sbtClaimLink: existingRewardLink,
    }),
    { status: 200 }
  );
};

/**
 * Create a new order & registrant transactional; return the new order
 */
const createOrderAndRegistrant = async (
  eventUuid: string,
  telegramUserId: number,
  paymentAmount: number,
  paymentType: PaymentTypes,
  orderType: OrderTypeValues,
  telegramUsername: string
) => {
  let newOrder = null;

  await db.transaction(async (trx) => {
    newOrder = (
      await trx
        .insert(orders)
        .values({
          event_uuid: eventUuid,
          user_id: telegramUserId,
          total_price: paymentAmount,
          payment_type: paymentType, // e.g., "STAR", "TON", or "USDT"
          state: "completed",
          order_type: orderType,
          utm_source: null,
          updatedBy: "system",
        })
        .returning()
        .execute()
    ).pop();

    // Mark user as an event registrant (upsert with status = "approved")
    await trx
      .insert(eventRegistrants)
      .values({
        event_uuid: eventUuid,
        status: "approved",
        register_info: {
          telegramUsername,
          telegramUserId: String(telegramUserId),
        },
        user_id: telegramUserId,
      })
      .onConflictDoUpdate({
        target: [eventRegistrants.event_uuid, eventRegistrants.user_id],
        set: {
          status: "approved",
          register_info: {
            telegramUsername,
            telegramUserId: String(telegramUserId),
          },
        },
      })
      .execute();
  });

  return newOrder;
};

/**
 * Determine final SBT claim link to return
 */
const getSbtClaimLink = async (eventUuid: string, telegramUserId: number, orderType: string) => {
  // Start with an event-level reward link if it exists
  let sbtClaimLink = `https://onton.live/`;
  const eventRewardLink = await rewardDB.fetchRewardLinkForEvent(eventUuid);
  if (
    eventRewardLink &&
    typeof eventRewardLink.data === "object" &&
    "reward_link" in (eventRewardLink.data as Record<string, unknown>) &&
    typeof (eventRewardLink.data as { reward_link?: unknown }).reward_link === "string"
  ) {
    sbtClaimLink = (eventRewardLink.data as { reward_link: string }).reward_link;
  }

  // If it’s TS CSBT, try generating a user-specific link
  if (orderType === "ts_csbt_ticket") {
    try {
      const linkData = await rewardService.CsbtTicketForApi(eventUuid, telegramUserId);

      if (
        linkData &&
        typeof linkData === "object" &&
        "reward_link" in (linkData as Record<string, unknown>) &&
        typeof (linkData as { reward_link?: unknown }).reward_link === "string"
      ) {
        sbtClaimLink = (linkData as { reward_link: string }).reward_link;
      }
    } catch (err) {
      logger.error("Failed to create TSCSBT link", err);
    }
  }

  return sbtClaimLink;
};

export interface StructuredErrorShape {
  status: number;
  errorBody: {
    success: boolean;
    message?: string;
    status?: string;
    [key: string]: any;
  };
}

// A simple type guard function
export const isStructuredErrorShape = (err: unknown): err is StructuredErrorShape =>
  typeof err === "object" && err !== null && "status" in err && "errorBody" in err;

const externalSellerApi = {
  parseAndValidateRequest,
  fetchAndValidateEvent,
  fetchPaymentInfoAndCheckSoldOut,
  ensureUserExists,
  handleExistingOrder,
  createOrderAndRegistrant,
  getSbtClaimLink,
  isStructuredErrorShape,
};
export default externalSellerApi;
