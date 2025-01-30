import { db } from "@/db/db";
import { userRoles, accessRoleEnumType, accessRoleItemType } from "@/db/schema/userRoles";
import { users } from "@/db/schema/users";  // <--- Import the users table schema
import { eq, and } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { redisTools } from "@/lib/redisTools";

// -------------- CACHE KEYS --------------
const getAllRolesCacheKey = (itemType: string, itemId: number) =>
  `${redisTools.cacheKeys.user_roles}:${itemType}:${itemId}:all`;

const getActiveRolesCacheKey = (itemType: string, itemId: number) =>
  `${redisTools.cacheKeys.user_roles}:${itemType}:${itemId}:active`;

// Input type for upsert function
export interface EventUserEntry {
  user_id: number;
  active: boolean; // if true => status='active', if false => status='reactive'
  role: accessRoleEnumType;
}

/**
 * Lists all user roles for a given item (itemType + itemId),
 * returning both 'active' and 'reactive' statuses.
 *
 * Now includes a JOIN on the `users` table so we can return `username`.
 */
export async function listAllUserRolesForEvent(itemType: accessRoleItemType, itemId: number) {
  const cacheKey = getAllRolesCacheKey(itemType, itemId);

  try {
    // 1) Attempt to get from cache
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 2) Fetch from DB with LEFT JOIN (or JOIN) on `users`
    const rows = await db
      .select({
        itemId: userRoles.itemId,
        itemType: userRoles.itemType,
        userId: userRoles.userId,
        username: users.username,
        role: userRoles.role,
        status: userRoles.status,
        createdAt: userRoles.createdAt,
        updatedAt: userRoles.updatedAt,
        updatedBy: userRoles.updatedBy,

      })
      .from(userRoles)
      .leftJoin(users, eq(userRoles.userId, users.user_id))  // Join condition
      .where(
        and(
          eq(userRoles.itemId, itemId),
          eq(userRoles.itemType, itemType)
        )
      )
      .execute();

    // 3) Cache the result
    await redisTools.setCache(cacheKey, rows, redisTools.cacheLvl.short);
    return rows;
  } catch (error) {
    logger.error(`Error listing all user roles for item [${itemType}, ID=${itemId}]`, error);
    throw error;
  }
}

/**
 * Lists only 'active' user roles for a given item (itemType + itemId).
 * Also joins the `users` table to return `username`.
 */
export async function listActiveUserRolesForEvent(itemType: accessRoleItemType, itemId: number) {
  const cacheKey = getActiveRolesCacheKey(itemType, itemId);

  try {
    // 1) Attempt to get from cache
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 2) Fetch from DB (status='active'), JOIN on `users`
    const rows = await db
      .select({
        itemId: userRoles.itemId,
        itemType: userRoles.itemType,
        userId: userRoles.userId,
        username: users.username,
        role: userRoles.role,
        status: userRoles.status,
        createdAt: userRoles.createdAt,
        updatedAt: userRoles.updatedAt,
        updatedBy: userRoles.updatedBy,

      })
      .from(userRoles)
      .leftJoin(users, eq(userRoles.userId, users.user_id))
      .where(
        and(
          eq(userRoles.itemId, itemId),
          eq(userRoles.itemType, itemType),
          eq(userRoles.status, "active")
        )
      )
      .execute();

    // 3) Cache the result
    await redisTools.setCache(cacheKey, rows, redisTools.cacheLvl.short);
    return rows;
  } catch (error) {
    logger.error(`Error listing *active* user roles for item [${itemType}, ID=${itemId}]`, error);
    throw error;
  }
}

/**
 * Bulk Upsert function remains the same, no changes needed:
 */
export async function bulkUpsertUserRolesForEvent(
  itemType: accessRoleItemType,
  itemId: number,
  userList: EventUserEntry[],
  updatedBy: string = "system"
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Run everything in a transaction for atomicity
    await db.transaction(async (tx) => {
      for (const entry of userList) {
        const { user_id, active, role } = entry;

        // Check if a row already exists
        const existing = await tx
          .select()
          .from(userRoles)
          .where(
            and(
              eq(userRoles.itemId, itemId),
              eq(userRoles.itemType, itemType),
              eq(userRoles.userId, user_id),
              eq(userRoles.role, role)
            )
          )
          .execute();

        if (existing.length > 0) {
          // Update
          await tx
            .update(userRoles)
            .set({
              status: active ? "active" : "reactive",
              updatedAt: new Date(),
              updatedBy,
            })
            .where(
              and(
                eq(userRoles.itemId, itemId),
                eq(userRoles.itemType, itemType),
                eq(userRoles.userId, user_id),
                eq(userRoles.role, role)
              )
            )
            .execute();
        } else {
          // Insert
          await tx
            .insert(userRoles)
            .values({
              itemId,
              itemType,
              userId: user_id,
              role,
              status: active ? "active" : "reactive",
              updatedBy,
              updatedAt: new Date(),
            })
            .execute();
        }
      }
      // If we reach here, the transaction is successful -> it will commit automatically
    });

    // After successful commit, clear caches
    await redisTools.deleteCache(getAllRolesCacheKey(itemType, itemId));
    await redisTools.deleteCache(getActiveRolesCacheKey(itemType, itemId));

    return { success: true, error: null };
  } catch (err: any) {
    // If transaction fails or something else happens
    logger.error(`Error in bulkUpsertUserRolesForEvent for [${itemType}, ID=${itemId}]:`, err);

    // Return a consistent structure
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Export as an object, similar to your existing style.
 */
export const userRolesDB = {
  listAllUserRolesForEvent,
  listActiveUserRolesForEvent,
  bulkUpsertUserRolesForEvent,
};
