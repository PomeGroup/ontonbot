import { TRPCError } from "@trpc/server";
import { eventManagementProtectedProcedure, publicProcedure, router } from "../trpc";
import { couponDefinitionsDB } from "@/server/db/couponDefinitions.db";
import { couponItemsDB } from "@/server/db/couponItems.db";
import couponSchema from "@/zodSchema/couponSchema";
import { db } from "@/db/db";
import { logger } from "@sentry/core";

export const couponRouter = router({
  /**
   * 1) Add Coupons (Definition + Items)
   */
  addCoupons: eventManagementProtectedProcedure.input(couponSchema.addCouponsSchema).mutation(async ({ input }) => {
    try {
      return await db.transaction(async () => {
        // 1) Insert new coupon_definition
        let definition;
        try {
          definition = await couponDefinitionsDB.addCouponDefinition({
            event_uuid: input.event_uuid,
            cpd_type: "fixed", // Hard-coded to fixed
            cpd_status: "active",
            value: input.value,
            start_date: input.start_date,
            end_date: input.end_date,
            count: input.count,
            used: 0,
          });

          // If definition comes back null/undefined, fail early
          if (!definition) {
            logger.error("Failed to add coupon definition (null return).", { input });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to add coupon definition.",
            });
          }
        } catch (err) {
          logger.error("Error inserting coupon definition", { error: err, input });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error occurred while creating coupon definition.",
            cause: err, // attach original error if desired
          });
        }

        // 2) Bulk-insert coupon_items
        try {
          const insertedItems = await couponItemsDB.addCouponItems({
            coupon_definition_id: definition.id,
            event_uuid: input.event_uuid,
            quantity: input.count,
          });

          if (!insertedItems || insertedItems.length === 0) {
            logger.error("Failed to add coupon items (empty array).", { input });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to add coupon items.",
            });
          }

          return {
            success: true,
            definition,
            items: insertedItems,
          };
        } catch (err) {
          logger.error("Error inserting coupon items", { error: err, input });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error occurred while creating coupon items.",
            cause: err,
          });
        }
      });
    } catch (err) {
      // This catches anything thrown within the transaction callback.
      logger.error("Transaction failed for addCoupons.", { error: err, input });
      // If it's already a TRPCError, just rethrow; otherwise wrap it.
      if (err instanceof TRPCError) {
        throw err;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while adding coupons.",
        cause: err,
      });
    }
  }),

  /**
   *  Edit Dates Only
   */
  editCouponDefinitionDates: eventManagementProtectedProcedure
    .input(couponSchema.editCouponDatesSchema)
    .mutation(async ({ input }) => {
      const { id, event_uuid, start_date, end_date } = input;
      try {
        // Attempt the update
        await couponDefinitionsDB.updateCouponDefinition({
          id,
          event_uuid,
          start_date,
          end_date,
        });

        return { success: true };
      } catch (err) {
        logger.error("Error updating coupon definition dates", { error: err, input });
        // If it's already a TRPCError, rethrow, else wrap it
        if (err instanceof TRPCError) {
          throw err;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while updating coupon definition dates.",
          cause: err,
        });
      }
    }),

  /**
   * Update Coupon Definition Status
   */
  updateCouponDefinitionStatus: eventManagementProtectedProcedure
    .input(couponSchema.updateCouponDefinitionStatusSchema)
    .mutation(async ({ input }) => {
      const { id, event_uuid, status } = input;
      try {
        await couponDefinitionsDB.updateCouponDefinitionStatus({
          id,
          event_uuid,
          status,
        });

        return { success: true };
      } catch (err) {
        logger.error("Error updating coupon definition status", { error: err, input });
        if (err instanceof TRPCError) {
          throw err;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while updating coupon definition status.",
          cause: err,
        });
      }
    }),

  /**
   * Get List of Definitions (by event_uuid)
   */
  getCouponDefinitions: publicProcedure.input(couponSchema.getDefinitionsSchema).query(async ({ input }) => {
    const { event_uuid } = input;
    try {
      return await couponDefinitionsDB.getCouponDefinitionsByEventUuid(event_uuid);
    } catch (err) {
      logger.error("Error fetching coupon definitions", { error: err, input });
      if (err instanceof TRPCError) {
        throw err;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching coupon definitions.",
        cause: err,
      });
    }
  }),

  /**
   * Get List of Items (by coupon_definition_id)
   */
  getCouponItems: publicProcedure.input(couponSchema.getItemsSchema).query(async ({ input }) => {
    const { coupon_definition_id } = input;
    try {
      return await couponItemsDB.getCouponItemsByDefinitionId(coupon_definition_id);
    } catch (err) {
      logger.error("Error fetching coupon items", { error: err, input });
      if (err instanceof TRPCError) {
        throw err;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching coupon items.",
        cause: err,
      });
    }
  }),
});
