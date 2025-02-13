import { initDataProtectedProcedure, router } from "../trpc";
import { z } from "zod";
import { usersScoreDB } from "@/server/db/usersScore.db";
import { TRPCError } from "@trpc/server";
import { usersScoreActivity } from "@/db/schema/usersScore";

export const UsersScoreRouter = router({
  /**
   * Get the total score for a given user.
   */
  getTotalScoreByUserId: initDataProtectedProcedure.query(async (opts) => {
    try {
      const totalScore = await usersScoreDB.getTotalScoreByUserId(opts.ctx.user.user_id);
      return totalScore;
    } catch (error) {
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
        return { success: true, totalScore };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error retrieving total score by activity type for user id: ${opts.ctx.user.user_id} and activity type: ${opts.input.activityType}`,
        });
      }
    }),
});
