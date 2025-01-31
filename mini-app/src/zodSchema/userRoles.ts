import { z } from "zod";
import { accessRoleEnumSchema, accessRoleItemTypeSchema, userRoleStatusSchema } from "@/db/schema/userRoles";




/**
 * Bulk Upsert Input schema
 * Each entry has a "username" starting with "@", "active" boolean, and "role".
 */
export const userRolesBulkUpsertInputSchema = z.object({
  itemType: accessRoleItemTypeSchema, // e.g., 'event'
  itemId: z.number(),
  userList: z.array(
    z.object({
      username: z.string().regex(/^[A-Za-z0-9_]{1,}$/), // must start with @
      status: userRoleStatusSchema,
      role: accessRoleEnumSchema,
    })
  ),
});

/**
 * TypeScript type for the bulkUpsert input
 */
export type UserRolesBulkUpsertInput = z.infer<typeof userRolesBulkUpsertInputSchema>;
