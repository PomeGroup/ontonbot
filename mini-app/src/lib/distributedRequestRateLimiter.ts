import { getRedisClient } from "@/lib/redisClient";
import { redisTools } from "@/lib/redisTools"; // Or use redisTools directly

const MAX_REQUESTS_PER_SEC = 1;
const TIME_WINDOW_MS = 2000;

export const enforceDistributedRateLimit = async (apiName: string): Promise<void> => {
  const redisClient = await getRedisClient();
  const key = `${redisTools.cacheKeys.rateLimitRequestApi}${apiName}`;
  const now = Date.now();
  const cutoff = now - TIME_WINDOW_MS; // anything older than 1s is expired

  // 1) Remove old timestamps
  // ZREMRANGEBYSCORE key min max
  // Removes all members with score < cutoff
  await redisClient.zRemRangeByScore(key, 0, cutoff);

  // 2) Count how many are left
  const count = await redisClient.zCard(key);
  if (count >= MAX_REQUESTS_PER_SEC) {
    // We have to wait, because we already have 5 in this 1-second window
    // Find out how long we should wait. We can check the "oldest" item in the set.
    // ZRANGE key start stop [WITHSCORES]
    // For the oldest, we do ZRANGE with start=0, stop=0 => get earliest
    const [oldestTimestampStr] = await redisClient.zRange(key, 0, 0);
    if (oldestTimestampStr) {
      const oldestTimestamp = parseInt(oldestTimestampStr, 10);
      const wait = oldestTimestamp + TIME_WINDOW_MS - now;
      if (wait > 0) {
        // Wait that many ms
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      // After waiting, remove again in case the set advanced
      const newNow = Date.now();
      const newCutoff = newNow - TIME_WINDOW_MS;
      await redisClient.zRemRangeByScore(key, 0, newCutoff);
    }
  }

  // At this point, we know there's capacity for at least 1 new request
  // We'll add the new request timestamp in a separate function
};

export const recordDistributedRequest = async (apiName: string): Promise<void> => {
  const redisClient = await getRedisClient();
  const key = `${redisTools.cacheKeys.rateLimitRequestApi}${apiName}`;
  const now = Date.now();
  // Add the new timestamp to the sorted set. Score=now, member=now
  await redisClient.zAdd(key, [{ score: now, value: now.toString() }]);
};
