import { initDataProtectedProcedure, router } from "../trpc";
import { z } from "zod";
import { usersScoreDB } from "@/db/modules/usersScore.db";
import { TRPCError } from "@trpc/server";
import { usersScoreActivity } from "@/db/schema/usersScore";

import { logger } from "@/server/utils/logger";
const getEventsWithClaimAndScoreInfiniteInput = z.object({
  activityType: z.enum(usersScoreActivity.enumValues),
  limit: z.number().min(1).max(50).default(10),
  cursor: z.number().min(0).default(0),
  // 'cursor' represents the offset in an offset-based pagination approach.
});
export const UsersScoreRouter = router({
  /**
   * Get the total score for a given user.
   */
  getTotalScoreByUserId: initDataProtectedProcedure.query(async (opts) => {
    try {
      const totalScore = await usersScoreDB.getTotalScoreByUserId(opts.ctx.user.user_id);
      return totalScore || 0;
    } catch (error) {
      logger.error(`Error retrieving total score for user id: ${opts.ctx.user.user_id}`, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Error retrieving total score for user id: ${opts.ctx.user.user_id}`,
      });
    }
  }),

  /**
   * Get the total score for a given user filtered by a specific activity type.
   */
  getTotalScoreByActivityTypeAndUserId: initDataProtectedProcedure
    .input(
      z.object({
        activityType: z.enum(usersScoreActivity.enumValues),
      })
    )
    .query(async (opts) => {
      try {
        const totalScore = await usersScoreDB.getTotalScoreByActivityTypeAndUserId(
          opts.ctx.user.user_id,
          opts.input.activityType
        );
        return totalScore;
      } catch (error) {
        logger.error(
          `Error retrieving total score by activity type for user id: ${opts.ctx.user.user_id} and activity type: ${opts.input.activityType}`,
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error retrieving total score by activity type for user id: ${opts.ctx.user.user_id} and activity type: ${opts.input.activityType}`,
        });
      }
    }),

  getScoreDetail: initDataProtectedProcedure.input(getEventsWithClaimAndScoreInfiniteInput).query(async ({ ctx, input }) => {
    try {
      // 1) Destructure and compute flags
      const { activityType, limit, cursor } = input;
      const currentTimeSec = Math.floor(Date.now() / 1000);

      let isPaid = false;
      let isOnline = false;
      let pointsCouldBeClaimed = 0;

      switch (activityType) {
        case "paid_online_event":
          isPaid = true;
          isOnline = true;
          pointsCouldBeClaimed = 10;
          break;
        case "paid_offline_event":
          isPaid = true;
          pointsCouldBeClaimed = 20;
          break;
        case "free_online_event":
          isOnline = true;
          pointsCouldBeClaimed = 1;
          break;
        case "free_offline_event":
          pointsCouldBeClaimed = 10;
          break;
      }

      logger.log(
        `getEventsWithClaimAndScoreInfinite: userId=${ctx.user.user_id}, activityType=${activityType}, ` +
          `isPaid=${isPaid}, isOnline=${isOnline}, pointsCouldBeClaimed=${pointsCouldBeClaimed}, ` +
          `limit=${limit}, cursor=${cursor}`
      );

      // 2) Fetch data with offset & limit
      const data = await usersScoreDB.getEventsWithClaimAndScoreDBPaginated(
        ctx.user.user_id,
        activityType,
        isPaid,
        isOnline,
        pointsCouldBeClaimed,
        currentTimeSec,
        limit,
        cursor
      );

      // 3) Determine the nextCursor (if there are more records beyond this batch)
      // If data.length < limit => we've likely hit the end, so no next cursor
      let nextCursor: number | null = null;
      if (data.length === limit) {
        // The next offset after this batch
        nextCursor = cursor + limit;
      }

      return {
        items: data,
        nextCursor,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Error getting paginated events with claim & score for user: ${ctx.user.user_id}`,
        cause: error,
      });
    }
  }),
});
