import { db } from "@/db/db";
import { visitors } from "@/db/schema";
import { validateMiniAppData } from "@/utils";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { checkIsAdminOrOrganizer } from "../db/events";
import { selectVisitorsByEventUuid } from "../db/visitors";
import {adminOrganizerProtectedProcedure, eventManagementProtectedProcedure, publicProcedure, router} from "../trpc";

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
      const {  limit = 25, cursor = 0 ,dynamic_fields =true} = opts.input;
      const data = await selectVisitorsByEventUuid(opts.input.event_uuid, limit, cursor ,dynamic_fields ,opts.input.search);
      return { ...data, event : opts.ctx.event || null };
    }),

  // protect
  add: publicProcedure
    .input(
      z.object({
        initData: z.string().optional(),
        event_uuid: z.string(),
      })
    )
    .mutation(async (opts) => {
      if (!opts.input.initData) {
        return;
      }

      const { valid, initDataJson } = validateMiniAppData(opts.input.initData);

      if (!valid) {
        return;
      }
    // @todo: Add cache for this
      const existingVisitor = await db
        .select()
        .from(visitors)
        .where(
          and(
            eq(visitors.user_id, initDataJson.user.id),
            eq(visitors.event_uuid, opts.input.event_uuid)
          )
        )
        .execute();

      if (existingVisitor.length !== 0) {
        return;
      }

      await db
        .insert(visitors)
        .values({
          user_id: initDataJson.user.id,
          event_uuid: opts.input.event_uuid,
          updatedBy: initDataJson.user.id.toString(),
        })
        .execute();
    }),
});
