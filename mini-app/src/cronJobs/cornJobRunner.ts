import { redisTools } from "@/lib/redisTools";
import { logger } from "@/server/utils/logger";
import { getErrorMessages } from "@/lib/error";
import { sendLogNotification } from "@/lib/tgBot";

const CACHE_TTL = 40_000;

export const cronJobRunner = (fn: (_: () => any) => any) => {
  const name = fn.name; // Get function name automatically
  const cacheLockKey = redisTools.cacheKeys.cronJobLock + name;

  return async () => {
    const cronLock = await redisTools.getCache(redisTools.cacheKeys.cronJobLock + name);

    if (cronLock) {
      return;
    }

    await redisTools.setCache(redisTools.cacheKeys.cronJobLock + name, true, CACHE_TTL);

    async function pushLockTTl() {
      try {
        return await redisTools.setRedisKeyTTL(cacheLockKey, CACHE_TTL);
      } catch (error) {
        logger.error("REDIS_ERROR", getErrorMessages(error));
      }
    }

    try {
      await fn(pushLockTTl);
    } catch (err) {
      logger.log(`Cron job ${name} error: ${getErrorMessages(err)} \n\n`, err);
      await sendLogNotification({
        message: `Cron job ${name} error: ${getErrorMessages(err)}`,
        topic: "system",
      });
    } finally {
      await redisTools.deleteCache(redisTools.cacheKeys.cronJobLock + name);
    }
  };
};
