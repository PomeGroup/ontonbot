import { db } from "@/db/db";
import { users } from "@/db/schema";
import { redisTools } from "@/lib/redisTools";
import { InferSelectModel, eq } from "drizzle-orm";
import { logger } from "@/server/utils/logger";

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
// Cache key prefix
// Function to generate cache key for user
const getUserCacheKey = (userId: number) => `${redisTools.cacheKeys.user}${userId}`;

// Function to generate cache key for wallet
const getWalletCacheKey = (userId: number) => `${redisTools.cacheKeys.userWallet}${userId}`;

export const selectUserById = async (
  userId: number
): Promise<InferSelectModel<typeof users> | null> => {
  const cacheKey = getUserCacheKey(userId);

  // Try to get the user from cache
  const cachedUser = await redisTools.getCache(cacheKey);
  if (cachedUser) {
    return cachedUser; // Return cached user if found
  }

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

    if (userInfo.length > 0) {
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
          role: "user", // default role
          // explicitly do NOT include any org_* fields here
          // is_premium, allows_write_to_pm, photo_url also can be inserted if you want
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

  logger.log("selectUserByUsername", userInfo);
  if (userInfo.length > 0) {
    return userInfo[0];
  }

  return null; // Return null if user not found
};

export const usersDB = {
  selectUserById,
  insertUser,
  selectWalletById,
  updateWallet,
  selectUserByUsername,
};
