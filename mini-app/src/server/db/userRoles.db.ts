import { db } from "@/db/db";
import { accessRoleItemType, userRoles } from "@/db/schema/userRoles";
import { eq, and } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { redisTools } from "@/lib/redisTools";

// -------------- CACHE KEYS --------------
const getAllRolesCacheKey = (itemType: string, itemId: number) => `${redisTools.cacheKeys.user_roles}:${itemType}:${itemId}:all`;
const getActiveRolesCacheKey = (itemType: string, itemId: number) => `${redisTools.cacheKeys.user_roles}:${itemType}:${itemId}:active`;

// Input type for upsert function
export interface EventUserEntry {
  user_id: number;
  active: boolean; // if true => status='active', if false => status='reactive'
}

/**
 * Lists all user roles for a given item (itemType + itemId),
 * returning both 'active' and 'reactive' statuses.
 */
export async function listAllUserRolesForEvent(itemType: accessRoleItemType, itemId: number) {
  const cacheKey = getAllRolesCacheKey(itemType, itemId);

  try {
    // 1) Attempt to get from cache
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 2) Fetch from DB
    const rows = await db
      .select({
        itemId: userRoles.itemId,
        itemType: userRoles.itemType,
        userId: userRoles.userId,
        role: userRoles.role,
        status: userRoles.status,
        createdAt: userRoles.createdAt,
        updatedAt: userRoles.updatedAt,
        updatedBy: userRoles.updatedBy,
      })
      .from(userRoles)
      .where(and(eq(userRoles.itemId, itemId), eq(userRoles.itemType, itemType)))
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
 */
export async function listActiveUserRolesForEvent(itemType: accessRoleItemType, itemId: number) {
  const cacheKey = getActiveRolesCacheKey(itemType, itemId);

  try {
    // 1) Attempt to get from cache
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 2) Fetch from DB (status='active')
    const rows = await db
      .select({
        itemId: userRoles.itemId,
        itemType: userRoles.itemType,
        userId: userRoles.userId,
        role: userRoles.role,
        status: userRoles.status,
        createdAt: userRoles.createdAt,
        updatedAt: userRoles.updatedAt,
        updatedBy: userRoles.updatedBy,
      })
      .from(userRoles)
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
 * Bulk upsert user roles for a given item (itemType + itemId) based on a user list.
 *
 * - If record exists => update `status` (active/reactive)
 * - If not exists => insert new row (default role can be 'admin' or anything you specify)
 */
export async function bulkUpsertUserRolesForEvent(
  itemType: accessRoleItemType,
  itemId: number,
  userList: EventUserEntry[],
  role: "owner" | "admin" | "checkin_officer" = "admin",
  updatedBy: string = "system"
): Promise<{ success: boolean; error: string | null }> {
  try {
    for (const entry of userList) {
      // Step 1: Check if user_roles row exists
      const existing = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.itemId, itemId),
            eq(userRoles.itemType, itemType),
            eq(userRoles.userId, entry.user_id),
            eq(userRoles.role, role)
          )
        )
        .execute();

      // Step 2: If exists => update
      if (existing.length > 0) {
        await db
          .update(userRoles)
          .set({
            status: entry.active ? "active" : "reactive",
            updatedBy,
          })
          .where(
            and(
              eq(userRoles.itemId, itemId),
              eq(userRoles.itemType, itemType),
              eq(userRoles.userId, entry.user_id),
              eq(userRoles.role, role)
            )
          )
          .execute();
      } else {
        // Step 3: If not exist => insert
        await db.insert(userRoles).values({
          itemId,
          itemType,
          userId: entry.user_id,
          role,
          status: entry.active ? "active" : "reactive",
          updatedBy,
        }).execute();
      }
    }

    // Step 4: Clear relevant caches
    await redisTools.deleteCache(getAllRolesCacheKey(itemType, itemId));
    await redisTools.deleteCache(getActiveRolesCacheKey(itemType, itemId));

    return { success: true, error: null };
  } catch (err: any) {
    logger.error(`Error in bulkUpsertUserRolesForEvent for [${itemType}, ID=${itemId}]:`, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
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
