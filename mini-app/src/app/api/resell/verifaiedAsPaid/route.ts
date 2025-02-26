import { db } from "@/db/db";
import { eventRegistrants, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/server/utils/logger";
import "@/lib/gracefullyShutdown";

import { selectEventByUuid } from "@/server/db/events";
import ordersDB from "@/server/db/orders.db";
// ⬇️ Import the new method instead of CsbtTicket
import rewardService from "@/server/routers/services/rewardsService";
import { selectUserById, usersDB } from "@/server/db/users";
import { fetchRewardLinkForEvent } from "@/server/db/rewards.db";

/**
 * According to your README spec for verifaiedAsPaid:
 *
 * Request Body
 * {
 *   "telegramUserId": 123456789,
 *   "telegramUsername": "@user_name",
 *   "eventUuid": "event-uuid-string",
 *   "paymentType": "STAR" | "TON" | "USDT",
 *   "paymentAmount": 50
 * }
 *
 * Success Response
 * {
 *   "success": true,
 *   "isOntonUser": true,
 *   "sbtClaimLink": "https://..."
 * }
 *
 * Error Response
 * {
 *   "success": false,
 *   "status": ["some_error_code"]
 * }
 */
const verifiedAsPaidSchema = z.object({
  telegramUserId: z.number(),
  telegramUsername: z.string().min(1),
  eventUuid: z.string().uuid(),
  paymentType: z.enum(["STAR", "TON", "USDT"]),
  paymentAmount: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parseResult = verifiedAsPaidSchema.safeParse(rawBody);

    // -------------------------- Validate Request -------------------------
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          status: ["bad_request"],
          errors: parseResult.error.flatten(),
        }),
        { status: 400 }
      );
    }

    const { telegramUserId, telegramUsername, eventUuid, paymentType, paymentAmount } = parseResult.data;

    /* --------------------------------------------------------------------------
     *    1) INSERT (OR UPDATE) USER IF NEEDED
     * -------------------------------------------------------------------------- */
    const user = await selectUserById(telegramUserId);
    if (!user) {
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
        return new Response(
          JSON.stringify({
            success: false,
            status: ["user_insert_failed"],
          }),
          { status: 400 }
        );
      }
    }

    // ---------------------------- Find Event -----------------------------
    const eventData = await selectEventByUuid(eventUuid);
    if (!eventData) {
      return new Response(
        JSON.stringify({
          success: false,
          status: ["event_not_exist"],
        }),
        { status: 404 }
      );
    }

    if (!eventData.activity_id) {
      return new Response(
        JSON.stringify({
          success: false,
          status: ["event_not_active"],
        }),
        { status: 410 }
      );
    }

    // ------------------- Payment Info & Ticket Type ----------------------
    const eventPaymentInfo = await db.query.eventPayment.findFirst({
      where(fields, { eq }) {
        return eq(fields.event_uuid, eventUuid);
      },
    });
    if (!eventPaymentInfo) {
      return new Response(
        JSON.stringify({
          success: false,
          status: ["event_not_exist"],
        }),
        { status: 404 }
      );
    }

    // Suppose eventPaymentInfo.ticket_type is either "NFT" or "TSCSBT"
    const ticketOrderTypeMap = {
      NFT: "nft_mint",
      TSCSBT: "ts_csbt_ticket",
    } as const;

    const eventTicketingType = eventPaymentInfo.ticket_type as keyof typeof ticketOrderTypeMap;
    const orderType = ticketOrderTypeMap[eventTicketingType] ?? "nft_mint";

    // -------------------- (Optional) Check Sold Out ----------------------
    const { isSoldOut } = await ordersDB.checkIfSoldOut(eventUuid, orderType, eventData.capacity || 0);
    if (isSoldOut) {
      return new Response(
        JSON.stringify({
          success: false,
          status: ["sold_out"],
        }),
        { status: 410 }
      );
    }

    // -------------- Check If User Already Has an Order -------------------
    const existingOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.user_id, telegramUserId),
        eq(orders.order_type, orderType),
        eq(orders.event_uuid, eventData.event_uuid),
        eq(orders.state, "completed")
      ),
    });

    if (existingOrder) {
      // Possibly fetch or generate the CSBT ticket if needed
      let existingRewardLink = `https://onton.app/claim/${existingOrder.uuid}`;

      if (orderType === "ts_csbt_ticket") {
        try {
          // The function can return different shapes (existingReward.data or response.data.data)
          const linkData = await rewardService.CsbtTicketForApi(eventUuid, telegramUserId);

          // Safely check if `linkData` has a `reward_link` property
          if (
            linkData &&
            typeof linkData === "object" &&
            // TypeScript won't narrow "in" checks on unknown shapes, so we cast linkData to an object:
            "reward_link" in (linkData as Record<string, unknown>) &&
            typeof (linkData as { reward_link?: unknown }).reward_link === "string"
          ) {
            existingRewardLink = (linkData as { reward_link: string }).reward_link || existingRewardLink;
          }
        } catch (err) {
          logger.error("Failed to create or fetch existing TSCSBT link", err);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          isOntonUser: !!user,
          sbtClaimLink: existingRewardLink,
        }),
        { status: 200 }
      );
    }

    // --------------------------- Create Order -----------------------------
    let newOrder;
    await db.transaction(async (trx) => {
      newOrder = (
        await trx
          .insert(orders)
          .values({
            event_uuid: eventUuid,
            user_id: telegramUserId,
            total_price: paymentAmount,
            payment_type: paymentType, // e.g., "STAR", "TON", or "USDT"
            state: "completed", // because user has already paid
            order_type: orderType,
            utm_source: null,
            updatedBy: "system",
          })

          .returning()
          .execute()
      ).pop();

      // Mark user as an event registrant
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

    if (!newOrder) {
      return new Response(
        JSON.stringify({
          success: false,
          status: ["order_creation_failed"],
        }),
        { status: 500 }
      );
    }
    let sbtClaimLink = `https://onton.live/`;
    // ------------------- Generate or Return SBT Link ---------------------
    const eventRewardLink = await fetchRewardLinkForEvent(eventUuid);
    if (
      eventRewardLink &&
      typeof eventRewardLink.data === "object" &&
      "reward_link" in (eventRewardLink.data as Record<string, unknown>) &&
      typeof (eventRewardLink.data as { reward_link?: unknown }).reward_link === "string"
    ) {
      // Safely check if `eventRewardLink` has a `reward_link` property
      sbtClaimLink = (eventRewardLink.data as { reward_link: string }).reward_link;
    }

    if (orderType === "ts_csbt_ticket") {
      try {
        // The function can return different shapes (existingReward.data or response.data.data)
        const linkData = await rewardService.CsbtTicketForApi(eventUuid, telegramUserId);

        // Safely check if `linkData` has a `reward_link` property
        if (
          linkData &&
          typeof linkData === "object" &&
          // TypeScript won't narrow "in" checks on unknown shapes, so we cast linkData to an object:
          "reward_link" in (linkData as Record<string, unknown>) &&
          typeof (linkData as { reward_link?: unknown }).reward_link === "string"
        ) {
          sbtClaimLink = (linkData as { reward_link: string }).reward_link;
        }
      } catch (err) {
        logger.error("Failed to create or fetch existing TSCSBT link", err);
      }
    }

    // --------------------------- Final Response ---------------------------
    return new Response(
      JSON.stringify({
        success: true,
        isOntonUser: true,
        sbtClaimLink,
      }),
      { status: 200 }
    );
  } catch (err) {
    logger.error("verifaiedAsPaid Endpoint Error", err);

    return new Response(
      JSON.stringify({
        success: false,
        status: ["bad_request"],
      }),
      { status: 400 }
    );
  }
}

export const dynamic = "force-dynamic";
