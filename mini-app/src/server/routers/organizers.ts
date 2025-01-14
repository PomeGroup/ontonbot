import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { usersDB } from "@/server/db/users";
import { initDataProtectedProcedure, publicProcedure, router } from "../trpc";
import { logger } from "../utils/logger";
import { orgFieldsSchema, searchOrganizersInput } from "@/zodSchema/OrganizerDataSchema";

export const organizerRouter = router({
  updateOrganizer: initDataProtectedProcedure
    .input(orgFieldsSchema)
    .mutation(async (opts) => {
      // 1) Grab the user's ID from context
      const userId = opts.ctx.user.user_id;

      // 2) Pass the validated input fields to your update method
      logger.log("updateOrganizer", opts.input);
      const { success, data, error } = await usersDB.updateOrganizerFieldsByUserId(
        userId,
        opts.input
      );

      // 3) If the update failed, throw an error
      if (!success) {
        logger.error(`Failed to update org fields: ${userId}` , { input : opts.input, error });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error ?? "Failed to update org fields.",
        });
      }

      // 4) Return the success response (the updated user or null)
      return {
        success,
        data,
        error, // Will be `null` if successful
      };
    }),

  searchOrganizers: publicProcedure
    .input(searchOrganizersInput)
    .query(async ({ input }) => {
      const { searchString, cursor, limit } = input;
      const offset = cursor ?? 0;

      const items = await usersDB.searchOrganizers({
        searchString,
        offset,
        limit,
      });

      // Determine nextCursor (if fewer than `limit` items returned, no more pages)
      const nextCursor = items.length < limit ? null : offset + items.length;


      return {
        items,
        nextCursor,
      };
    }),
  getOrganizer: publicProcedure
    .input(z.object({ user_id: z.number() }))
    .query(async ({ input }) => {
      try {
        const { user_id } = input;
        // 1) Query the user by ID
        const user = await usersDB.getOrganizerById(user_id);

        // 2) Throw if user doesn’t exist
        if (!user.data?.user_id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Organizer with ID ${user_id} not found.`,
          });
        }
        // 4) Return success shape
        return {
          success: true,
          data: user.data,
          error: null,
        };
      } catch (err) {
        // If it's already a TRPCError, re-throw it
        if (err instanceof TRPCError) {
          throw err;
        }
        // Otherwise, wrap it in a TRPCError
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }),
});
