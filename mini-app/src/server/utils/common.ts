import { redisTools } from "@/lib/redisTools";
import { setTimeout as sleep } from "timers/promises";
import { logger } from "@/server/utils/logger";

async function runWithLock(
  task: () => Promise<any>, // The async task to execute
  {
    taskName = "UnnamedTask", // Name for logging
    lockKey, // Unique key for the lock
    ttl = 600, // TTL for the lock in seconds (default: 10 minutes)
    sleepDuration = 1000, // Sleep duration between executions in milliseconds
    runCount = Infinity, // Number of times to run the task
  }: {
    taskName?: string;
    lockKey: string;
    ttl?: number;
    sleepDuration?: number;
    runCount?: number;
  }
) {
  let executions = 0;

  while (executions < runCount) {
    const lockValue = await redisTools.getCache(lockKey);
    if (lockValue) {
      logger.log(`[${taskName}] Task skipped. Lock is active.`);
      await sleep(sleepDuration);
      continue;
    }

    await redisTools.setCache(lockKey, true, ttl);
    logger.log(`[${taskName}] Lock set. Task execution started.`);

    try {
      const startTime = Date.now();
      await task();
      logger.log(`[${taskName}] Task completed successfully in ${Date.now() - startTime}ms.`);
    } catch (error) {
      logger.error(`[${taskName}] Task failed: ${error}`, error);
    } finally {
      await redisTools.deleteCache(lockKey);
      logger.log(`[${taskName}] Lock cleared. Task cycle completed.`);
    }

    executions++;
    if (executions < runCount) await sleep(sleepDuration);
  }

  logger.log(`[${taskName}] Task execution finished after ${executions} iterations.`);
}
