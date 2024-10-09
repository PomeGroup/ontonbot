import { db } from "@/db/db";
import { users } from "@/db/schema";
import { redisTools } from "@/lib/redisTools";
import { InferSelectModel, eq } from "drizzle-orm";

// Cache key prefix

// Function to generate cache key for user
const getUserCacheKey = (userId: number) =>
  `${redisTools.cacheKeys.user}${userId}`;

// Function to generate cache key for wallet
const getWalletCacheKey = (userId: number) =>
  `${redisTools.cacheKeys.userWallet}${userId}`;

// Function to get a user by user ID with caching
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
    })
    .from(users)
    .where(eq(users.user_id, userId))
    .execute();

  if (userInfo.length > 0) {
    await redisTools.setCache(cacheKey, userInfo[0], redisTools.cacheLvl.short); // Cache the user
    return userInfo[0];
  }

  return null; // Return null if user not found
};

// Insert a user and clear cache
const insertUser = async (initDataJson: {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    language_code: string;
  };
}) => {
  const user = selectUserById(initDataJson.user.id);
  if (!user) {
    await db
      .insert(users)
      .values({
        user_id: initDataJson.user.id,
        username: initDataJson.user.username,
        first_name: initDataJson.user.first_name,
        last_name: initDataJson.user.last_name,
        language_code: initDataJson.user.language_code,
        role: "user", // Default role as "user"
      })
      .onConflictDoNothing() // Avoid conflict on duplicate entries
      .execute();
  } else {
    console.log("User already exists0");
    return user;
  }
};

// Function to select wallet by user ID with caching
const selectWalletById = async (user_id: number) => {
  const cacheKey = getWalletCacheKey(user_id);

  // Try to get the wallet from cache
  const cachedWallet = await redisTools.getCache(cacheKey);
  if (cachedWallet) {
    return cachedWallet; // Return cached wallet if found
  }

  // If not found in cache, query the database
  const walletInfo = await db
    .select({ wallet: users.wallet_address })
    .from(users)
    .where(eq(users.user_id, user_id))
    .execute();

  if (walletInfo.length > 0) {
    await redisTools.setCache(
      cacheKey,
      walletInfo[0],
      redisTools.cacheLvl.short
    ); // Cache the wallet
    return walletInfo[0];
  }

  return null; // Return null if wallet not found
};

// Update wallet and clear cache
const updateWallet = async (
  user_id: number,
  wallet_address: string,
  updatedBy: string
) => {
  await db
    .update(users)
    .set({
      wallet_address: wallet_address,
      updatedBy: updatedBy, // String value of the user who updated
    })
    .where(eq(users.user_id, user_id))
    .execute();

  // Clear cache for the updated user and wallet
  await redisTools.deleteCache(getUserCacheKey(user_id));
  await redisTools.deleteCache(getWalletCacheKey(user_id));
};

export const usersDB = {
  selectUserById,
  insertUser,
  selectWalletById,
  updateWallet,
};
