import { db } from "@/db/db";
import { orders } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import {
  eventManagementProtectedProcedure as evntManagerPP,
  initDataProtectedProcedure,
  router,
} from "../trpc";
import { logger } from "../utils/logger";
import ordersDB from "@/server/db/orders.db";
import { selectUserById } from "../db/users";

const hardCodedEventUuid = '4e76c66c-ef3d-483c-9836-a3e12815b044'

export const ordersRouter = router({
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
        const updatedRows = await db
          .update(orders)
          .set({ state: state })
          .where(
            and(
              eq(orders.uuid, order_uuid),
              eq(orders.user_id, user_id),
              or(eq(orders.state, "new"), eq(orders.state, "confirming"), eq(orders.state, "cancelled"))
            )
          )
          .returning({ uuid: orders.uuid })
          .execute();

        if (updatedRows.length > 0) {
          return { code: 200, message: "Order State Updated" };
        } else {
          return { code: 200, message: "nothing to update" };
        }
      } catch (error) {
        logger.log("order_updateOrderState_internal_error", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "internal server error" });
      }
    }),

  getEventOrders: evntManagerPP.input(z.object({ event_uuid: z.string().uuid() })).query(async (opts) => {
    return await ordersDB.getEventOrders(opts.input.event_uuid);
  }),

  addPromoteToOrganizerOrder: initDataProtectedProcedure.input(z.object({ user_id: z.string().optional() })).mutation(async (opts) => {
    const user_id = opts.ctx.user.user_id;
    const user = await selectUserById(user_id, false);
    if (user?.role === "organizer") throw new TRPCError({ code: "CONFLICT", message: "user is already an organizer" });

    const user_order = (
      await db
        .select()
        .from(orders)
        .where(and(eq(orders.user_id, user_id), eq(orders.order_type, "promote_to_organizer")))
        .execute()
    ).pop();

    if (user_order) {
      if (user_order.state === "processing") {
        throw new TRPCError({ code: "CONFLICT", message: "user already has processing order" });
      }

      //Since We Don't have the ban feature currently this can prevent a user from becomming organizer more than once
      if (user_order.state === "completed") {
        throw new TRPCError({ code: "CONFLICT", message: "user has a completed promote to organizer order " });
      }

      return user_order;
    }

    const new_order = await db
      .insert(orders)
      .values({
        order_type: "promote_to_organizer",
        user_id: user_id,
        payment_type: "TON",
        total_price: 10,
        state: "new",
        event_uuid: hardCodedEventUuid
      })
      .returning()
      .execute();

    return new_order;
  }),

  getPromoteToOrganizerOrder: initDataProtectedProcedure.input(z.object({ user_id: z.string().optional() })).query(async (opts) => {
    const user_id = opts.ctx.user.user_id;
    const result_order = await db.query.orders.findFirst({
      where: and(eq(orders.user_id, user_id), eq(orders.order_type, "promote_to_organizer")),
    });

    if (result_order) return result_order;
    else return null;
  }),
});
