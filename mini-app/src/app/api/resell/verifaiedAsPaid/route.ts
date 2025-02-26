import { db } from "@/db/db";
import { eventRegistrants, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/server/utils/logger";
import "@/lib/gracefullyShutdown";

import { selectEventByUuid } from "@/server/db/events";
import ordersDB from "@/server/db/orders.db";
import { addVisitor } from "@/server/db/visitors";
import { CsbtTicket } from "@/server/routers/services/rewardsService";

/**
 * According to your README spec for verifaiedAsPaid:
 *
 * Request Body
 * {
 *   "telegramUserId": 123456789,
 *   "telegramUsername": "@user_name",
 *   "eventUuid": "event-uuid-string",
 *   "paymentType": "STAR" | "TON" | "USDT" ,
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
 *   "status": [ "some_error_code" ]
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

    // -------------- Example: Check user in DB if needed -----------------
    // If you maintain user records, you can verify telegramUserId here.

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
        eq(orders.event_uuid, eventData.event_uuid)
      ),
    });

    // If order exists, you can either return the existing SBT link
    // or do something else. For demonstration, let's assume we return success
    if (existingOrder) {
      // Possibly fetch reward link if the event is TSCSBT
      let existingRewardLink = `https://onton.app/claim/${existingOrder.uuid}`;
      if (orderType === "ts_csbt_ticket") {
        // Attempt to fetch or generate the CSBT ticket if not previously done
        // (We skip creation if it already exists in your `reward` table)
        try {
          const linkData = await CsbtTicket(eventUuid, telegramUserId);
          // If CsbtTicket found or created a link, we can use that
          if (linkData) {
            existingRewardLink = linkData.reward_link || existingRewardLink;
          }
        } catch (err) {
          logger.error("Failed to create or fetch existing TSCSBT link", err);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          isOntonUser: true,
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
            payment_type: paymentType, // "star" or "ton"
            state: "completed", // Because user has already paid
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
        .execute();

      // (Optional) Mark them as a visitor
      await addVisitor(telegramUserId, eventUuid);
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

    // ------------------- Generate or Return SBT Link ---------------------
    let sbtClaimLink = `no_link`; // Fallback link

    // If the event is TSCSBT, call CsbtTicket to create a user reward link
    if (orderType === "ts_csbt_ticket") {
      try {
        const csbtResult = await CsbtTicket(eventUuid, telegramUserId);
        // `CsbtTicket` returns res.data.data from createUserRewardLink
        if (csbtResult) {
          // Depending on what your createUserRewardLink returns,
          // you might have `short_link`, `url`, or some other field
          sbtClaimLink = csbtResult.reward_link || sbtClaimLink;
        }
      } catch (err) {
        logger.error("Failed to create TSCSBT link", err);
        // We can still return success but the fallback link will be used
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
