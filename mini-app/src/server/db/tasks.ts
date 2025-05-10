import { db } from "@/db/db";
import { logger } from "@/server/utils/logger";
import { redisTools } from "@/lib/redisTools";

import { eq } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core/session";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

import { tasks, Tasks, TasksInsert } from "@/db/schema/tasks";

/* ------------------------------------------------------------------
   Redis Cache Keys
------------------------------------------------------------------ */
function buildCacheKeyById(id: number) {
  return `tasks:id:${id}`;
}

/* For tasks by group_id, we might build a separate cache key: */
function buildCacheKeyByGroupId(groupId: number) {
  return `tasks:group_id:${groupId}`;
}

/* ------------------------------------------------------------------
   Get Methods
------------------------------------------------------------------ */
export async function getTaskById(id: number): Promise<Tasks | undefined> {
  try {
    const cacheKey = buildCacheKeyById(id);
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Tasks;
    }

    const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).execute();

    if (row) {
      await redisTools.setCache(cacheKey, JSON.stringify(row), redisTools.cacheLvl.long);
      return row;
    }
    return undefined;
  } catch (error) {
    logger.error("tasksDB: Error getting tasks by ID:", error);
    throw error;
  }
}

/** Example: get all tasks for a given group */
export async function getTasksByGroupId(groupId: number): Promise<Tasks[]> {
  try {
    const cacheKey = buildCacheKeyByGroupId(groupId);
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Tasks[];
    }

    const rows = await db.select().from(tasks).where(eq(tasks.groupId, groupId)).execute();

    await redisTools.setCache(cacheKey, JSON.stringify(rows), redisTools.cacheLvl.long);
    return rows;
  } catch (error) {
    logger.error("tasksDB: Error getting tasks by groupId:", error);
    throw error;
  }
}

/* ------------------------------------------------------------------
   Insert Methods
------------------------------------------------------------------ */
export async function addTask(data: TasksInsert): Promise<Tasks> {
  try {
    const [inserted] = await db.insert(tasks).values(data).returning().execute();
    await revalidateCache(inserted);
    return inserted;
  } catch (error) {
    logger.error("tasksDB: Error inserting tasks:", error);
    throw error;
  }
}

export async function addTaskTx(tx: PgTransaction<PostgresJsQueryResultHKT>, data: TasksInsert): Promise<Tasks> {
  const [inserted] = await tx.insert(tasks).values(data).returning().execute();
  await revalidateCache(inserted);
  return inserted;
}

/* ------------------------------------------------------------------
   Update Methods
------------------------------------------------------------------ */
export async function updateTaskById(id: number, data: Partial<TasksInsert>): Promise<Tasks | undefined> {
  try {
    const result = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning().execute();

    const updated = result[0];
    if (updated) {
      await revalidateCache(updated);
      return updated;
    }
    return undefined;
  } catch (error) {
    logger.error("tasksDB: Error updating tasks:", error);
    throw error;
  }
}

/* ------------------------------------------------------------------
   Cache Revalidation
------------------------------------------------------------------ */
async function revalidateCache(row: Tasks) {
  // 1) Re-cache the row by ID
  const idKey = buildCacheKeyById(row.id);
  await redisTools.setCache(idKey, JSON.stringify(row), redisTools.cacheLvl.long);

  // 2) If it belongs to a group, re-cache that group’s tasks
  if (row.groupId !== null && row.groupId !== undefined) {
    const groupKey = buildCacheKeyByGroupId(row.groupId);
    // We'll fetch all tasks for that group from the DB & re-cache:
    const groupTasks = await db.select().from(tasks).where(eq(tasks.groupId, row.groupId)).execute();
    await redisTools.setCache(groupKey, JSON.stringify(groupTasks), redisTools.cacheLvl.long);
  }
}

/* ------------------------------------------------------------------
   Export
------------------------------------------------------------------ */
export const tasksDB = {
  getTaskById,
  getTasksByGroupId,
  addTask,
  addTaskTx,
  updateTaskById,
};
