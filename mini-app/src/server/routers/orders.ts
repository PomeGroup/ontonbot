import { db } from "@/db/db";
import { orders } from "@/db/schema";
import { Address, toNano } from "@ton/core";
import { TRPCError } from "@trpc/server";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getEventByUuid, getEventsWithFilters as DBgetEventsWithFilters, selectEventByUuid } from "../db/events";
import {
  adminOrganizerProtectedProcedure,
  eventManagementProtectedProcedure as evntManagerPP,
  initDataProtectedProcedure,
  publicProcedure,
  router,
} from "../trpc";
import { logger } from "../utils/logger";
import ordersDB from "@/server/db/orders.db";

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

    getEventOrders : evntManagerPP.input(z.object({ event_uuid: z.string().uuid() })).query(async (opts) => {
      return await ordersDB.getEventOrders(opts.input.event_uuid);
    }),
});
