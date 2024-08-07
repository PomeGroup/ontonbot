import { db } from "@/db/db";
import { publicProcedure, router } from "../trpc";
import { visitors } from "@/db/schema";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { selectVisitorsByEventUuid } from "../db/visitors";
import { checkIsAdminOrOrganizer } from "../db/events";
import { validateMiniAppData } from "@/utils";

export const visitorsRouter = router({
  // protect
  getAll: publicProcedure
    .input(
      z.object({
        event_uuid: z.string(),
        initData: z.string().optional(),
        limit: z.number().optional(),
        cursor: z.number().optional(),
      })
    )
    .query(async (opts) => {
      const { event_uuid, initData, limit = 25, cursor = 0 } = opts.input;

      if (!initData) {
        return undefined;
      }

      const { valid } = await checkIsAdminOrOrganizer(initData);

      if (!valid) {
        throw new Error("Unauthorized access or invalid role");
      }

      return selectVisitorsByEventUuid(event_uuid, limit, cursor);
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
        })
        .execute();
    }),
});
