import { getRedisClient } from "@/lib/redisClient";

/**
 * Checks the rate limit for a specific user & route:
 *  - Allows up to `limit` requests per `windowSeconds`.
 */
export const checkRateLimit = async (
  userId: string,
  routeName: string,
  limit = 10,
  windowSeconds = 60
): Promise<{ allowed: boolean; remaining: number }> => {
  const redisClient = await getRedisClient();

  // Build a unique key for this user + route
  const key = `rate-limit:${routeName}:${userId}`;

  // Increment the counter
  const currentCount = await redisClient.incr(key);

  // If it's the first request in this window, set an expiration of 'windowSeconds'
  if (currentCount === 1) {
    await redisClient.expire(key, windowSeconds);
  }

  // If over the limit, not allowed
  if (currentCount > limit) {
    return { allowed: false, remaining: 0 };
  }

  // Otherwise, allowed
  const remaining = limit - currentCount;
  return { allowed: true, remaining };
};
