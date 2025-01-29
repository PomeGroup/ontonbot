import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { userRolesDB } from "@/server/db/userRoles.db";
import { adminOrganizerProtectedProcedure, router } from "../trpc";
import { logger } from "../utils/logger";

// 1) Allowed values at runtime
export const allowedItemTypes = ["event"] as const;

// 3) Zod schema
export const accessRoleItemTypeSchema = z.enum(allowedItemTypes);

export const userRolesRouter = router({
  /**
   * List ALL user roles (both 'active' and 'reactive') for a given item.
   * itemType can be 'event' (or future types if you extend itemTypeEnum).
   */
  listAllUserRolesForEvent: adminOrganizerProtectedProcedure
    .input(
      z.object({
        itemType: accessRoleItemTypeSchema,
        itemId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { itemType, itemId } = input;
        const rows = await userRolesDB.listAllUserRolesForEvent(itemType, itemId);
        return {
          success: true,
          data: rows,
        };
      } catch (error) {
        logger.error("Error in listAllUserRolesForEvent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list user roles.",
        });
      }
    }),

  /**
   * List only 'active' user roles for a given item (itemType + itemId).
   */
  listActiveUserRolesForEvent: adminOrganizerProtectedProcedure
    .input(
      z.object({
        itemType: accessRoleItemTypeSchema,
        itemId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { itemType, itemId } = input;
        const rows = await userRolesDB.listActiveUserRolesForEvent(itemType, itemId);
        return {
          success: true,
          data: rows,
        };
      } catch (error) {
        logger.error("Error in listActiveUserRolesForEvent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list active user roles.",
        });
      }
    }),

  /**
   * Bulk upsert user roles for a given item (itemType + itemId).
   * - Expects an array of { user_id, active }
   * - If record exists => update status
   * - If not => insert (default role='admin')
   */
  bulkUpsertUserRolesForEvent: adminOrganizerProtectedProcedure
    .input(
      z.object({
        itemType: accessRoleItemTypeSchema,
        itemId: z.number(),
        userList: z.array(
          z.object({
            user_id: z.number(),
            active: z.boolean(),
          })
        ),
        // Optionally let the client specify which role to assign
        role: z.enum(["owner", "admin", "checkin_officer"]).optional().default("admin"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { itemType, itemId, userList, role } = input;

      try {
        const result = await userRolesDB.bulkUpsertUserRolesForEvent(
          itemType,
          itemId,
          userList,
          role,
          ctx.user?.user_id?.toString() ?? "system"
        );

        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error ?? "Failed to upsert user roles",
          });
        }

        return {
          success: true,
          data: null,
        };
      } catch (error) {
        logger.error("Error in bulkUpsertUserRolesForEvent:", error);
        if (error instanceof TRPCError) {
          throw error;
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to bulk upsert user roles.",
          });
        }
      }
    }),
});
