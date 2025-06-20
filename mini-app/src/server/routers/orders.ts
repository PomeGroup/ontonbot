import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eventManagementProtectedProcedure as evntManagerPP, initDataProtectedProcedure, router } from "../trpc";
import { logger } from "@/server/utils/logger";
import ordersDB from "@/db/modules/orders.db";
import { selectUserById } from "@/db/modules/users.db";
import { Address } from "@ton/core";
import { checkRateLimit } from "@/lib/checkRateLimit";
import eventDB from "@/db/modules/events.db";
import { eventPayment, eventRegistrants, orders } from "@/db/schema";
import { db } from "@/db/db";
import { and, eq, inArray } from "drizzle-orm";
import { applyCouponDiscount } from "@/lib/applyCouponDiscount";
import { EventRegistrantStatusType } from "@/db/schema/eventRegistrants";

// Hard-coded example event UUID
const hardCodedEventUuid = "4e76c66c-ef3d-483c-9836-a3e12815b044";

const tonAddr = z.string().refine((s) => {
  try {
    Address.parse(s);
    return true;
  } catch {
    return false;
  }
}, "Invalid TON address");

const guestSchema = z.object({
  event_payment_id: z.number().int().positive(),
  full_name: z.string().min(2),
  wallet: tonAddr,
  company: z.string().optional(),
  position: z.string().optional(),
});

const addOrderInput = z.object({
  event_uuid: z.string().uuid(),
  guests: z.array(guestSchema).min(1),

  buyer_telegram: z.string(),
  buyer_wallet: tonAddr,

  affiliate_id: z.string().nullable().optional(),
  coupon_code: z.string().nullable().optional(),
});
/* maps ticket_type -> order_type as before */
const orderTypeFor = (t: "NFT" | "TSCSBT") => (t === "NFT" ? ("nft_mint" as const) : ("ts_csbt_ticket" as const));

export const ordersRouter = router({
  addOrder: initDataProtectedProcedure.input(addOrderInput).mutation(async ({ input, ctx }) => {
    const userId = ctx.user.user_id;

    /* ─ rate-limit ─ */
    const { allowed } = await checkRateLimit(userId.toString(), "addOrder", 5, 60);
    if (!allowed)
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many order attempts. Please wait.",
      });

    /* ─ event ─ */
    const event = await eventDB.selectEventByUuid(input.event_uuid);
    if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

    /* ─ payment rows used in this request ─ */
    const paymentIds = [...new Set(input.guests.map((g) => g.event_payment_id))];

    const paymentRows = await db
      .select()
      .from(eventPayment)
      .where(
        and(
          eq(eventPayment.event_uuid, input.event_uuid),
          inArray(eventPayment.id, paymentIds),
          eq(eventPayment.active, true)
        )
      );

    if (paymentRows.length !== paymentIds.length)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Some ticket IDs are invalid or inactive.",
      });

    /* all rows must share currency */
    const currency = paymentRows[0].payment_type;
    if (paymentRows.some((r) => r.payment_type !== currency))
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Mixed currencies in one order are not supported.",
      });

    const order_type = orderTypeFor(paymentRows[0].ticket_type);

    /* ─ capacity check ─ */
    const extraSeats = input.guests.length;
    // const { isSoldOut } = await ordersDB.checkIfSoldOut(input.event_uuid, order_type, event.capacity ?? 0, extraSeats);
    // if (isSoldOut) throw new TRPCError({ code: "BAD_REQUEST", message: "Event tickets are sold out." });

    /* ─ coupon ─ */
    const { discountedPrice, couponId, errorResponse } = await applyCouponDiscount(
      input.coupon_code,
      input.event_uuid,
      paymentRows[0]
    );
    if (errorResponse) throw errorResponse;

    /* summary prices */
    const defaultTotal = input.guests.reduce((s, g) => {
      const row = paymentRows.find((r) => r.id === g.event_payment_id)!;
      return s + row.price;
    }, 0);
    const finalTotal = discountedPrice * input.guests.length;

    /* ─ main TX ─ */
    const orderRow = await db.transaction(async (trx) => {
      /* could reuse existing order if needed – omitted for brevity */

      /* create order */
      const [order] = await trx
        .insert(orders)
        .values({
          event_uuid: input.event_uuid,
          user_id: userId,
          default_price: defaultTotal,
          total_price: finalTotal,
          payment_type: currency,
          order_type,
          state: "confirming",
          utm_source: input.affiliate_id,
          updatedBy: "system",
          coupon_id: couponId,
        })
        .returning();

      /* create one registrant per guest */
      for (const g of input.guests) {
        const row = paymentRows.find((r) => r.id === g.event_payment_id)!;

        await trx.insert(eventRegistrants).values({
          event_uuid: input.event_uuid,
          event_payment_id: row.id,
          order_uuid: order.uuid,
          user_id: userId, // creator – you can extend with g.user_id later
          buyer_user_id: userId,
          status: "pending" as EventRegistrantStatusType,
          default_price: row.price,
          final_price: discountedPrice,
          register_info: {
            full_name: g.full_name,
            wallet: g.wallet,
            company: g.company ?? null,
            position: g.position ?? null,
          },
        });
      }

      return order;
    });

    /* ─ success ─ */
    return {
      success: true,
      order_id: orderRow.uuid,
      payment_type: currency,
      total_price: orderRow.total_price,
      default_price: defaultTotal,
      utm_tag: input.affiliate_id,
    };
  }),

  getOrder: initDataProtectedProcedure
    .input(
      z.object({
        order_id: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      /* fetch */
      const row = await db.query.orders.findFirst({
        where: eq(orders.uuid, input.order_id),
      });

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      /* simple access-control: owner OR admin */
      if (row.user_id !== ctx.user.user_id && ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN", message: "No access" });

      return { order: row };
    }),
  // 1) Update order state
  updateOrderState: initDataProtectedProcedure
    .input(
      z.object({
        order_uuid: z.string().uuid(),
        state: z.enum(["cancelled", "confirming"]),
      })
    )
    .mutation(async (opts) => {
      const user_id = opts.ctx.user.user_id;
      const state = opts.input.state;
      const order_uuid = opts.input.order_uuid;

      try {
        // DB call moved to ordersDB
        const updatedRows = await ordersDB.updateOrderState(order_uuid, user_id, state);

        if (updatedRows.length > 0) {
          return { code: 200, message: "Order State Updated" };
        } else {
          return { code: 200, message: "Nothing to update" };
        }
      } catch (error) {
        logger.error("order_updateOrderState_internal_error", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        });
      }
    }),

  // 2) Get event orders
  getEventOrders: evntManagerPP.input(z.object({ event_uuid: z.string().uuid() })).query(async (opts) => {
    // DB call moved to ordersDB
    return ordersDB.getEventOrders(opts.input.event_uuid);
  }),

  // 3) Add a 'promote_to_organizer' order if user doesn't already have one
  addPromoteToOrganizerOrder: initDataProtectedProcedure
    .input(z.object({ user_id: z.number().optional() }))
    .mutation(async (opts) => {
      const user_id = opts.ctx.user.user_id;

      // Check if user is already an organizer
      const user = await selectUserById(user_id, false);
      if (user?.role === "organizer") {
        throw new TRPCError({ code: "CONFLICT", message: "User is already an organizer" });
      }

      // DB call: find existing promoter order
      const userOrder = await ordersDB.findPromoteToOrganizerOrder(user_id);
      if (userOrder) {
        if (userOrder.state === "processing") {
          throw new TRPCError({ code: "CONFLICT", message: "User already has a processing order" });
        }
        if (userOrder.state === "completed") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User has a completed 'promote to organizer' order",
          });
        }
        // If it's 'new', 'confirming', or 'cancelled', just return it
        return userOrder;
      }

      // DB call: create a new 'promote_to_organizer' order
      const newOrder = await ordersDB.createPromoteToOrganizerOrder(user_id, hardCodedEventUuid);
      return newOrder[0];
    }),

  // 4) Get a user's 'promote_to_organizer' order
  getPromoteToOrganizerOrder: initDataProtectedProcedure
    .input(z.object({ user_id: z.number().optional() }))
    .query(async (opts) => {
      const user_id = opts.ctx.user.user_id;
      // DB call moved to ordersDB
      const resultOrder = await ordersDB.getPromoteToOrganizerOrder(user_id);

      return resultOrder ?? null;
    }),
});
