import { db } from "@/db/db";
import { eventRegistrants, users, visitors, events } from "@/db/schema";
import { redisTools } from "@/lib/redisTools";
import { InferSelectModel, eq, sql, and, or } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import xss from "xss";
import { logSQLQuery } from "@/lib/logSQLQuery";
// User data from the init data
interface InitUserData {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    language_code: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
    photo_url?: string;
  };
}

export interface MinimalOrganizerData {
  user_id: number;
  photo_url: string | null;
  participated_event_count: number | null;
  hosted_event_count: number | null;
  org_channel_name: string | null;
  org_support_telegram_user_name: string | null;
  org_x_link: string | null;
  org_bio: string | null;
  org_image: string | null;
  role: string;
}

// Cache key prefix
// Function to generate cache key for user
export const getUserCacheKey = (userId: number) => `${redisTools.cacheKeys.user}${userId}`;

// Function to generate cache key for wallet
const getWalletCacheKey = (userId: number) => `${redisTools.cacheKeys.userWallet}${userId}`;


// For convenience, define a response type
interface UpdateOrgFieldsResponse {
  success: boolean;
  data: Awaited<ReturnType<typeof selectUserById>>; // This will be the updated user or null
  error: string | null;
}


/**
 * Updates the org_* fields for a given user by userId, with basic XSS sanitization.
 */
export const updateOrganizerFieldsByUserId = async (
  userId: number,
  orgData: Partial<{
    org_channel_name: string;
    org_support_telegram_user_name: string;
    org_x_link: string;
    org_bio: string;
    org_image: string;
  }>
): Promise<UpdateOrgFieldsResponse> => {
  try {
    // 1) Check if the user exists
    const existingUser = await selectUserById(userId);
    if (!existingUser) {
      return {
        success: false,
        data: null,
        error: `User with ID ${userId} not found.`,
      };
    }

    // 2) Build the updateData with sanitized values
    const updateData: Partial<typeof users.$inferSelect> = {};

    // Only update org_channel_name if it exists in orgData
    if (orgData.org_channel_name !== undefined) {
      updateData.org_channel_name = xss(orgData.org_channel_name);
    }

    if (orgData.org_support_telegram_user_name !== undefined) {
      updateData.org_support_telegram_user_name = xss(
        orgData.org_support_telegram_user_name
      );
    }

    if (orgData.org_x_link !== undefined) {
      updateData.org_x_link = xss(orgData.org_x_link);
    }

    if (orgData.org_bio !== undefined) {
      updateData.org_bio = xss(orgData.org_bio);
    }

    if (orgData.org_image !== undefined) {
      updateData.org_image = xss(orgData.org_image);
    }

    // If nothing needs updating, return the existing user
    if (Object.keys(updateData).length === 0) {
      return {
        success: true,
        data: existingUser,
        error: null,
      };
    }

    // 3) Perform the update in the database
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.user_id, userId))
      .execute();

    // 4) Clear the user cache so it will be reloaded next time
    await redisTools.deleteCache(getUserCacheKey(userId));

    // 5) Return the updated user
    const updatedUser = await selectUserById(userId);
    return {
      success: true,
      data: updatedUser,
      error: null,
    };
  } catch (err: any) {
    logger.error(`Error updating org fields for user ID=${userId}:`, err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

/**
 * Select organizers by optional search string (with offset + limit).
 */
export const searchOrganizers = async (params: {
  searchString?: string;
  offset: number;
  limit: number;
}) => {
  const { searchString, offset, limit } = params;

  // Always require role='organizer'
  const conditions = [eq(users.role, "organizer")];
  // If a search string is provided, add a case-insensitive condition on `org_channel_name`
  if (searchString) {
    // Drizzle doesn't have a built-in "ilike" for all dialects, so we use raw SQL:
    conditions.push(
      sql`LOWER(${users.org_channel_name}) LIKE LOWER(${`%${searchString}%`})`
    );
  }

  // Now pass all conditions to a single `.where(and(...conditions))`
  // Build the query but don't execute yet
  const query = db
    .select({
      user_id: users.user_id,
      first_name: users.first_name,
      last_name: users.last_name,
      photo_url: users.photo_url,
      org_support_telegram_user_name: users.org_support_telegram_user_name,
      org_channel_name: users.org_channel_name,
      org_bio: users.org_bio,
      org_image: users.org_image,
      org_x_link: users.org_x_link,
    })
    .from(users)
    .where(and(...conditions))
    .offset(offset)
    .limit(limit);

  // Convert to SQL + parameters
  logSQLQuery(query.toSQL().sql, query.toSQL().params);

  // Now execute
  return await query.execute();
};

export const selectUserById = async (
  userId: number,
  use_cached_user : boolean = true,
  update_cache : boolean = true
): Promise<InferSelectModel<typeof users> | null> => {
  const cacheKey = getUserCacheKey(userId);

  // Try to get the user from cache
  if(use_cached_user){
    const cachedUser = await redisTools.getCache(cacheKey);
    if (cachedUser) {
      console.log("cachedUser", cachedUser);
      return cachedUser; // Return cached user if found
    }
  }
  await updateEventCountsForUser(userId);
  // If not found in cache, query the database
  try {
    const userInfo = await db
      .select({
        user_id: users.user_id,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        wallet_address: users.wallet_address,
        language_code: users.language_code,
        role: users.role,
        created_at: users.created_at,
        updatedAt: users.updatedAt,
        updatedBy: users.updatedBy,
        is_premium: users.is_premium,
        allows_write_to_pm: users.allows_write_to_pm,
        photo_url: users.photo_url,
        participated_event_count: users.participated_event_count,
        hosted_event_count: users.hosted_event_count,
        has_blocked_the_bot: users.has_blocked_the_bot,
        org_channel_name: users.org_channel_name,
        org_support_telegram_user_name: users.org_support_telegram_user_name,
        org_x_link: users.org_x_link,
        org_bio: users.org_bio,
        org_image: users.org_image,
      })
      .from(users)
      .where(eq(users.user_id, userId))
      .execute();

    if (userInfo.length > 0 && update_cache) {
      await redisTools.setCache(cacheKey, userInfo[0], redisTools.cacheLvl.short); // Cache the user
      return userInfo[0];
    }
    return null;
  } catch (e) {
    logger.log("get user error: ", e);
    return null;
  }
};


export const insertUser = async (
  initDataJson: InitUserData
): Promise<InferSelectModel<typeof users> | null> => {
  const { id, username, first_name, last_name, language_code } =
    initDataJson.user;

  const user = await selectUserById(id);

  // 1) If user does NOT exist, insert:
  if (!user) {
    try {
      await db
        .insert(users)
        .values({
          user_id: id,
          username,
          first_name,
          last_name,
          language_code,
          role: "user",
          is_premium: initDataJson.user.is_premium ?? false,
          allows_write_to_pm: initDataJson.user.allows_write_to_pm ?? false,
          photo_url: initDataJson.user.photo_url ?? null,
        })
        .onConflictDoNothing()
        .execute();

      return await selectUserById(id);
    } catch (e) {
      logger.error("Error adding new user:", e);
      return null;
    }
  } else {
    // 2) If user exists, compare the fields of interest
    const {
      language_code: dbLanguageCode,
      username: dbUsername,
      first_name: dbFirstName,
      last_name: dbLastName,
      is_premium: dbIsPremium,
      allows_write_to_pm: dbAllowsWriteToPm,
      photo_url: dbPhotoUrl,
    } = user;

    // Build an update object only if fields are changed
    const updateData: Partial<InferSelectModel<typeof users>> = {};

    if (dbLanguageCode !== language_code) {
      updateData.language_code = language_code;
    }
    if (dbUsername !== username) {
      updateData.username = username;
    }
    if (dbFirstName !== first_name) {
      updateData.first_name = first_name;
    }
    if (dbLastName !== last_name) {
      updateData.last_name = last_name;
    }
    if (dbIsPremium !== initDataJson.user.is_premium) {
      updateData.is_premium = initDataJson.user.is_premium ?? false;
    }
    if (dbAllowsWriteToPm !== initDataJson.user.allows_write_to_pm) {
      updateData.allows_write_to_pm = initDataJson.user.allows_write_to_pm ?? false;
    }
    if (dbPhotoUrl !== initDataJson.user.photo_url) {
      updateData.photo_url = initDataJson.user.photo_url ?? null;
    }

    // If there are changes, update:
    if (Object.keys(updateData).length > 0) {
      try {
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.user_id, id))
          .execute();

        // Clear cache for this user
        await redisTools.deleteCache(getUserCacheKey(id));

        // Re-fetch updated user
        return await selectUserById(id);
      } catch (e) {
        logger.error("Error updating user fields:", e);
        return user; // return the old user if update fails
      }
    }

    // If no fields changed, just return the existing user
    return user;
  }
};


const selectWalletById: (user_id: number) => Promise<{ wallet: string | null }> =
  async (user_id: number) => {
    const cacheKey = getWalletCacheKey(user_id);

    // Try to get the wallet from cache
    const cachedWallet = await redisTools.getCache(cacheKey);
    if (cachedWallet) {
      return cachedWallet as Promise<{ wallet: string }>; // Return cached wallet if found
    }

    // If not found in cache, query the database
    const walletInfo = await db
      .select({ wallet: users.wallet_address })
      .from(users)
      .where(eq(users.user_id, user_id))
      .execute();

    if (walletInfo.length > 0) {
      await redisTools.setCache(cacheKey, walletInfo[0], redisTools.cacheLvl.short);
      return walletInfo[0];
    }

    return { wallet: null }; // Return null if wallet not found
  };


const updateWallet = async (
  user_id: number,
  wallet_address: string,
  updatedBy: string
) => {
  await db
    .update(users)
    .set({
      wallet_address: wallet_address,
      updatedBy: updatedBy,
    })
    .where(eq(users.user_id, user_id))
    .execute();

  // Clear cache for the updated user and wallet
  await redisTools.deleteCache(getUserCacheKey(user_id));
  await redisTools.deleteCache(getWalletCacheKey(user_id));
};

export const selectUserByUsername = async (username: string) => {
  // If not found in cache, query the database
  logger.log("selectUserByUsername", username);
  const userInfo = await db
    .select({
      user_id: users.user_id,
      username: users.username,
      first_name: users.first_name,
      last_name: users.last_name,
      wallet_address: users.wallet_address,
      language_code: users.language_code,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updatedAt,
      updated_by: users.updatedBy,
      is_premium: users.is_premium,
      allows_write_to_pm: users.allows_write_to_pm,
      photo_url: users.photo_url,
      participated_event_count: users.participated_event_count,
      hosted_event_count: users.hosted_event_count,
      has_blocked_the_bot: users.has_blocked_the_bot,
      org_channel_name: users.org_channel_name,
      org_support_telegram_user_name: users.org_support_telegram_user_name,
      org_x_link: users.org_x_link,
      org_bio: users.org_bio,
      org_image: users.org_image,
    })
    .from(users)
    // Remove leading '@' if present
    .where(eq(users.username, username.replace(/^@/, "")))
    .execute();
  await updateEventCountsForUser(userInfo[0].user_id);
  logger.log("selectUserByUsername", userInfo);
  if (userInfo.length > 0) {
    return userInfo[0];
  }

  return null; // Return null if user not found
};


export const getOrganizerById = async (
  userId: number
): Promise<{
  success: boolean;
  data: Omit<MinimalOrganizerData, "role"> | null;
  error: string | null;
}> => {
  try {
    // 1) Use the same cache flow / logic
    const user = await selectUserById(userId);

    // 2) Check if user exists
    if (!user) {
      return {
        success: false,
        data: null,
        error: `User with ID=${userId} not found.`,
      };
    }

    // 3) Check if user is indeed organizer
    if (user.role !== "organizer") {
      return {
        success: false,
        data: null,
        error: `User with ID=${userId} is not an organizer.`,
      };
    }

    // 4) Pick only the minimal organizer fields from the user object
    //    (We also pick `role` so we can omit it from the final return)
    const minimalData: MinimalOrganizerData = {
      user_id: user.user_id,
      photo_url: user.photo_url,
      participated_event_count: user.participated_event_count,
      hosted_event_count: user.hosted_event_count,
      org_channel_name: user.org_channel_name,
      org_support_telegram_user_name: user.org_support_telegram_user_name,
      org_x_link: user.org_x_link,
      org_bio: user.org_bio,
      org_image: user.org_image,
      role: user.role,
    };

    // 5) Omit `role` from the returned data
    const { role, ...data } = minimalData;

    // 6) Return success
    return {
      success: true,
      data,
      error: null,
    };
  } catch (err: any) {
    // Catch any unexpected errors
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

export const updateEventCountsForUser = async (
  userId: number
) => {
  try {

    // 1) Count how many events the user is hosting
    const hostedCountResult = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(events)
      .where(eq(events.owner, userId))
      .execute();
    const hostedCount = hostedCountResult[0]?.count ?? 0;

    // 2) Count how many events user participated in
    //    2a) Count from eventRegistrants where status in ("approved", "checkedin")
    const participatedCountResult = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(eventRegistrants)
      .where(
        and(
          eq(eventRegistrants.user_id, userId),
          or(eq(eventRegistrants.status, "approved"), eq(eventRegistrants.status, "checkedin"))
        )
      )
      .execute();
    const participatedCount = participatedCountResult[0]?.count ?? 0;

    //    2b) Count from visitors table
    const visitorCountResult = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(visitors)
      .where(eq(visitors.user_id, userId))
      .execute();
    const visitorCount = visitorCountResult[0]?.count ?? 0;

    // 3) Sum the counts (registrants + visitors)
    const totalParticipated = participatedCount + visitorCount;

    // 4) Update the user record
    await db
      .update(users)
      .set({
        participated_event_count: totalParticipated,
        hosted_event_count: hostedCount,
      })
      .where(eq(users.user_id, userId))
      .execute();

    // 5) Clear user cache
    await redisTools.deleteCache(getUserCacheKey(userId));

  } catch (error) {
    logger.error(`Error updating event counts for user [ID=${userId}]`, error);
    throw error;
  }
};
export const usersDB = {
  selectUserById,
  insertUser,
  selectWalletById,
  updateWallet,
  selectUserByUsername,
  updateOrganizerFieldsByUserId,
  searchOrganizers,
  getOrganizerById,
};
