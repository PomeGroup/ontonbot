import { pool } from "./pool";
import { redisTools } from "../lib/redisTools";
import { logger } from "../utils/logger";

// Simple user interface
export interface UserRow {
  user_id: number;
  username: string;
  role: string;
  has_blocked_the_bot: boolean;
}

function getUserCacheKey(userId: number) {
  return `${redisTools.cacheKeys.user}${userId}`;
}

export async function getUser(usernameOrId: string): Promise<UserRow | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT *
       FROM users
       WHERE username = $1
          OR user_id::text = $1`,
      [usernameOrId],
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function isUserAdmin(usernameOrId: string) {
  const user = await getUser(usernameOrId);
  if (!user) {
    return { isAdmin: false, user: null };
  }
  return { isAdmin: user.role === "admin", user };
}

export async function isUserOrganizerOrAdmin(usernameOrId: string) {
  const user = await getUser(usernameOrId);
  if (!user) {
    return { isOrganizerOrAdmin: false, user: null };
  }
  return {
    isOrganizerOrAdmin: user.role === "organizer" || user.role === "admin",
    user,
  };
}

/** Change user's role in the "users" table */
export async function changeRole(newRole: string, username: string) {
  const client = await pool.connect();
  try {
    const userExists = await client.query(
      "SELECT * FROM users WHERE username = $1 OR user_id::text = $1",
      [username],
    );
    if (userExists.rowCount === 0) {
      throw new Error("user_not_found");
    }
    if (userExists.rows[0].role === newRole) {
      throw new Error("nothing_to_update");
    }

    const UpdateResult = await client.query(
      `
          UPDATE users
          SET role = $1
          WHERE username = $2
             OR user_id::text = $2
          RETURNING user_id
      `,
      [newRole, username],
    );
    const updatedUserId = UpdateResult.rows[0]?.user_id;
    await redisTools.deleteCache(getUserCacheKey(updatedUserId));

    // Optional: get total organizers
    const totalOrgsQuery = "SELECT count(*) FROM users WHERE role = $1";
    const result = await client.query(totalOrgsQuery, ["organizer"]);
    const totalOrgs = result.rows[0].count;

    logger.log(`Role for ${username} changed to ${newRole}.`);

    return {
      username: userExists.rows[0].username,
      user_id: userExists.rows[0].user_id,
      total_organizers_count: totalOrgs,
    };
  } catch (error) {
    logger.error("Error in changeRole:", error);
    throw error;
  } finally {
    client.release();
  }
}

/** Update user profile fields */
export async function updateUserProfile(
  userId: number,
  {
    isPremium,
    allowsWriteToPm,
    photoUrl,
    hasBlockedBot,
  }: {
    isPremium?: boolean;
    allowsWriteToPm?: boolean;
    photoUrl?: string;
    hasBlockedBot?: boolean;
  },
) {
  const client = await pool.connect();
  try {
    const setClauses: string[] = [];
    const values: any[] = [];

    if (typeof isPremium !== "undefined") {
      values.push(isPremium);
      setClauses.push(`is_premium = $${values.length}`);
    }
    if (typeof allowsWriteToPm !== "undefined") {
      values.push(allowsWriteToPm);
      setClauses.push(`allows_write_to_pm = $${values.length}`);
    }
    if (typeof photoUrl !== "undefined") {
      values.push(photoUrl);
      setClauses.push(`photo_url = $${values.length}`);
    }
    if (typeof hasBlockedBot !== "undefined") {
      values.push(hasBlockedBot);
      setClauses.push(`has_blocked_the_bot = $${values.length}`);
    }

    if (!setClauses.length) return; // nothing to update

    setClauses.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
        UPDATE users
        SET ${setClauses.join(", ")}
        WHERE user_id = $${values.length};
    `;
    await redisTools.deleteCache(getUserCacheKey(userId));
    await client.query(query, values);
  } finally {
    client.release();
  }
}

/** Get all admin/organizer users */
export async function getAdminOrganizerUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT *
       FROM users
       WHERE role IN ('admin', 'organizer')`,
    );
    return result.rows;
  } finally {
    client.release();
  }
}


/**
 * Finds a user by their Telegram user_id in the 'users' table.
 * Returns the row object if found; otherwise, null.
 */
export async function findUserById(userId: number) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
          SELECT user_id, username, first_name
          FROM users
          WHERE user_id = $1
      `,
      [userId],
    );

    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0];
  } finally {
    client.release();
  }
}

