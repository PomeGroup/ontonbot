import { db } from "@/db/db";
import { orders } from "@/db/schema";
import { Address, toNano } from "@ton/core";
import { TRPCError } from "@trpc/server";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { initDataProtectedProcedure, router } from "../trpc";

export const ordersRouter = router({
  createOrder: initDataProtectedProcedure
    .input(
      z.object({
        event_ticket_id: z.number(),
        full_name: z.string(),
        telegram: z.string(),
        company: z.string(),
        position: z.string(),
        owner_address: z
          .string()
          .refine((data) => Address.isAddress(Address.parse(data))),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.parsedInitData.user.id;

      const body = input;
      const eventTicket = await db.query.eventTicket.findFirst({
        where(fields, { eq }) {
          return eq(fields.id, body.event_ticket_id);
        },
      });

      const mintedTicketsCount = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(orders)
        .where(
          and(
            eq(orders.event_ticket_id, body.event_ticket_id),
            or(
              eq(orders.state, "minted"),
              eq(orders.state, "created"),
              eq(orders.state, "mint_request")
            )
          )
        )
        .execute();

      if (!eventTicket || !mintedTicketsCount.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event ticket does not exist",
        });
      }

      const userOrder = await db.query.orders.findFirst({
        where(fields, { eq, and, or }) {
          return and(
            eq(fields.user_id, userId),
            eq(fields.event_ticket_id, eventTicket.id),
            or(
              eq(fields.state, "created"),
              eq(fields.state, "minted"),
              eq(fields.state, "mint_request")
            )
          );
        },
      });

      if (userOrder) {
        throw new TRPCError({
          message: "An order is already being proccessed",
          code: "CONFLICT",
        });
      }

      if (mintedTicketsCount[0].count >= (eventTicket.count || 0)) {
        throw new TRPCError({
          message: "Event tickets are sold out",
          code: "NOT_FOUND",
        });
      }

      const new_order = (
        await db
          .insert(orders)
          .values({
            // TODO: change for multiple tickets
            count: 1,
            event_uuid: eventTicket.event_uuid,
            state: "created",
            total_price: toNano(eventTicket.price),
            user_id: userId,
            ...body,
            updatedBy: "system",
          })
          .returning()
      ).pop();

      return {
        order_id: new_order?.uuid,
        message: "order created successfully",
      };
    }),
});
