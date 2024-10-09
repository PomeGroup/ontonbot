import { db } from "@/db/db";
import { visitors } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { selectVisitorsByEventUuid } from "../db/visitors";
import {
  eventManagementProtectedProcedure,
  initDataProtectedProcedure,
  router,
} from "../trpc";

export const visitorsRouter = router({
  // protect
  getAll: eventManagementProtectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.number().optional(),
        dynamic_fields: z.boolean().optional(),
        search: z.string().optional().default(""),
      })
    )
    .query(async (opts) => {
      const { limit = 25, cursor = 0, dynamic_fields = true } = opts.input;
      const data = await selectVisitorsByEventUuid(
        opts.input.event_uuid,
        limit,
        cursor,
        dynamic_fields,
        opts.input.search
      );
      return { ...data, event: opts.ctx.event || null };
    }),

  // protect
  add: initDataProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string(),
      })
    )
    .mutation(async (opts) => {
      const existingVisitor = await db
        .select()
        .from(visitors)
        .where(
          and(
            eq(visitors.user_id, opts.ctx.parsedInitData.user.id),
            eq(visitors.event_uuid, opts.input.event_uuid)
          )
        )
        .execute();

      if (existingVisitor.length !== 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Visitor already exists for this event",
        });
      }

      await db
        .insert(visitors)
        .values({
          user_id: opts.ctx.parsedInitData.user.id,
          event_uuid: opts.input.event_uuid,
          updatedBy: opts.ctx.parsedInitData.user.id.toString(),
          updatedAt: new Date(),
        })
        .execute();

      return {
        message: "visitor added",
      };
    }),
});
