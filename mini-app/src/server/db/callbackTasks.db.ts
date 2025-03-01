import { db } from "@/db/db";
import { callbackTasks } from "@/db/schema/callbackTasks";
import { eq } from "drizzle-orm";
import type { CallbackTasksRow } from "@/db/schema/callbackTasks";
import { redisTools } from "@/lib/redisTools"; // your existing redis tools

/**
 * Fetch a single callbackTasks row by ID, with Redis caching.
 */
export const fetchCallbackTaskById = async (id: number): Promise<CallbackTasksRow | undefined> => {
  const cacheKey = `${redisTools.cacheKeys.callbackTask}${id}`;

  try {
    // 1) Check Redis cache first
    const cachedData = await redisTools.getCache(cacheKey);
    if (cachedData) {
      // parse the cached data as CallbackTasksRow
      const task: CallbackTasksRow = cachedData;
      return task;
    }

    // 2) If not cached, fetch from DB
    const [task] = await db.select().from(callbackTasks).where(eq(callbackTasks.id, id)).limit(1);

    // 3) If found in DB, store in Redis
    if (task) {
      await redisTools.setCache(cacheKey, task, redisTools.cacheLvl.medium);
    }

    return task;
  } catch (err) {
    // If there's a Redis error or any other issue, log & fallback to DB result only
    console.error(`Error fetching callback task by ID=${id}`, err);

    // Attempt direct DB fetch, ignoring cache
    const [task] = await db.select().from(callbackTasks).where(eq(callbackTasks.id, id)).limit(1);

    return task;
  }
};

const callbackTasksDB = {
  fetchCallbackTaskById,
};

export default callbackTasksDB;
