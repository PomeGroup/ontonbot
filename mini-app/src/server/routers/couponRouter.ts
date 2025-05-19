import { TRPCError } from "@trpc/server";
import { eventManagementProtectedProcedure, router } from "../trpc";
import { couponDefinitionsDB } from "@/db/modules/couponDefinitions.db";
import { couponItemsDB } from "@/db/modules/couponItems.db";
import couponSchema from "@/zodSchema/couponSchema";
import { db } from "@/db/db";
import { logger } from "@/server/utils/logger";
import eventDB from "@/db/modules/events";
import Papa from "papaparse";
import axios from "axios";

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
          const eventData = await eventDB.getEventByUuid(input.event_uuid);

          if (!eventData?.event_uuid) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "No event found.",
            });
          }

          if (input.count > 1000) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Can't Create more than 1000 codes",
            });
          }
          const percentage = Math.floor(Math.max(0, Math.min(input.value, 100)) + Number.EPSILON); // avoid negative values and cap at 100

          if (input.value > 100.0) {
            // avoid more than 100 percent discount
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "more than 100 percent discount is not present",
            });
          }

          definition = await couponDefinitionsDB.addCouponDefinition({
            event_uuid: input.event_uuid,
            cpd_type: "percent", // Hard-coded to percent
            cpd_status: "active",
            value: percentage,
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
        const eventData = await eventDB.getEventByUuid(event_uuid);

        if (!eventData?.event_uuid) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No event found.",
          });
        }
        await couponDefinitionsDB.updateCouponDefinition({
          id,
          event_uuid,
          start_date,
          end_date,
        });

        return { success: true };
      } catch (err: any) {
        // If our DB function threw a "No coupon definition found" error,
        // we can interpret that as NOT_FOUND.
        if (err.message?.includes("NOT_FOUND")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.message,
          });
        }

        logger.error("Error updating coupon definition dates", { error: err, input });
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
        const eventData = await eventDB.getEventByUuid(event_uuid);

        if (!eventData?.event_uuid) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No event found.",
          });
        }
        const updatedRows = await couponDefinitionsDB.updateCouponDefinitionStatus({
          id,
          event_uuid,
          status,
        });

        return { success: true };
      } catch (err: any) {
        // If our DB function threw "No coupon definition found" error
        if (err.message?.includes("NOT_FOUND")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.message,
          });
        }

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
  getCouponDefinitions: eventManagementProtectedProcedure
    .input(couponSchema.getDefinitionsSchema)
    .query(async ({ input }) => {
      const { event_uuid } = input;
      try {
        const eventData = await eventDB.getEventByUuid(event_uuid);

        if (!eventData?.event_uuid) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No event found.",
          });
        }
        return await couponDefinitionsDB.getCouponDefinitionsByEventUuid(event_uuid);
      } catch (err: any) {
        // If we threw "No coupon definitions found" in the DB layer, interpret that as NOT_FOUND
        if (err.message?.includes("NOT_FOUND")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.message,
          });
        }

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
});
