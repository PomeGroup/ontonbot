import { db } from "@/db/db";
import { accessRoleEnumType, accessRoleItemType, userRoles } from "@/db/schema/userRoles";
import { users } from "@/db/schema/users"; // <--- Import the users table schema
import { and, eq } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { redisTools } from "@/lib/redisTools";

export interface ActiveUserRole {
  itemId: number;
  itemType: "event" | "project"; // or string
  userId: number;
  username: string | null;
  role: "owner" | "admin" | "checkin_officer";
  status: "active" | "deactivate";
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

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

function getUserActiveRolesCacheKey(userId: number) {
  return `${redisTools.cacheKeys.user_roles}:byUser:${userId}:active`;
}

/**
 * Lists all *active* user roles for a given user (matching userId),
 * across *any* itemType and itemId.
 *
 * Joins the `users` table to return `username`, but note that
 * we already know `userId`—the join is just to be consistent
 * if you want to see the username in the result.
 */
export async function listActiveUserRolesForUser(userId: number): Promise<ActiveUserRole[]> {
  const cacheKey = getUserActiveRolesCacheKey(userId);

  try {
    // 1) Attempt to get from cache
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 2) Query DB for all active roles for this user
    const rows = await db
      .select({
        itemId: userRoles.itemId,
        itemType: userRoles.itemType,
        userId: userRoles.userId,
        username: users.username, // or any other user fields you want to expose
        role: userRoles.role,
        status: userRoles.status,
        createdAt: userRoles.createdAt,
        updatedAt: userRoles.updatedAt,
        updatedBy: userRoles.updatedBy,
      })
      .from(userRoles)
      // leftJoin in case the user record is missing or something else
      .leftJoin(users, eq(userRoles.userId, users.user_id))
      .where(and(eq(userRoles.userId, userId), eq(userRoles.status, "active")))
      .execute();

    // 3) Set cache
    await redisTools.setCache(cacheKey, rows, redisTools.cacheLvl.short);

    return rows;
  } catch (error) {
    logger.error(`Error listing active user roles for userId=${userId}`, error);
    throw error;
  }
}

/**
 * Returns all active user roles for a specific user,
 * filtered by a given itemType and itemId.
 */
export async function listActiveUserRolesForUserAndItem(
  userId: number,
  itemType: accessRoleItemType,
  itemId: number
): Promise<ActiveUserRole[]> {
  // 1) Get all active user roles (cached) for this user
  const allRoles = await listActiveUserRolesForUser(userId);

  // 2) Filter by itemType + itemId
  return allRoles.filter((role) => role.itemType === itemType && role.itemId === itemId);
}

/**
 * Checks if a user has *any* of the specified roles on a given item (itemType + itemId).
 * Returns an array of matching ActiveUserRole entries.
 *
 * If you only need a boolean, you can check `.length` on the returned array.
 */
export async function checkAccess(
  userId: number,
  roles: accessRoleEnumType[], // array of roles to check, e.g. ["owner", "checkin_officer"]
  itemType: accessRoleItemType, // e.g. "event"
  itemId: number
): Promise<ActiveUserRole[]> {
  // 1) Get all active roles for this user
  const userRoles = await listActiveUserRolesForUser(userId);

  // 2) Filter roles that match the itemType, itemId, and are in the `roles` array
  return userRoles.filter(
    (r) =>
      r.itemType === itemType &&
      r.itemId === itemId &&
      roles.includes(r.role)
  );
}


export async function checkHasAnyAccessToItemType(
  userId: number,
  roles: accessRoleEnumType[], // array of roles to check, e.g. ["owner", "checkin_officer"]
  itemType: accessRoleItemType, // e.g. "event"
): Promise<ActiveUserRole[]> {
  // 1) Get all active roles for this user
  const userRoles = await listActiveUserRolesForUser(userId);

  // 2) Filter roles that match the itemType, itemId, and are in the `roles` array
  return userRoles.filter(
    (r) =>
      r.itemType === itemType &&
      roles.includes(r.role)
  );
}

/**
 * Lists all user roles for a given item (itemType + itemId),
 * returning both 'active' and 'reactive' statuses.
 *
 * Now includes a JOIN on the `users` table so we can return `username`.
 */
export async function listAllUserRolesForEvent(itemType: accessRoleItemType, itemId: number): Promise<ActiveUserRole[]> {
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
      .leftJoin(users, eq(userRoles.userId, users.user_id)) // Join condition
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
 * Also joins the `users` table to return `username`.
 */
export async function listActiveUserRolesForEvent(itemType: accessRoleItemType, itemId: number): Promise<ActiveUserRole[]> {
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
      .where(and(eq(userRoles.itemId, itemId), eq(userRoles.itemType, itemType), eq(userRoles.status, "active")))
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
              status: active ? "active" : "deactivate",
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
              status: active ? "active" : "deactivate",
              updatedBy,
              updatedAt: new Date(),
            })
            .execute();
        }
        await redisTools.deleteCache(getUserActiveRolesCacheKey(user_id));
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
  checkAccess,
  listAllUserRolesForEvent,
  listActiveUserRolesForEvent,
  listActiveUserRolesForUserAndItem,
  checkHasAnyAccessToItemType,
  bulkUpsertUserRolesForEvent,
  listActiveUserRolesForUser,
};
