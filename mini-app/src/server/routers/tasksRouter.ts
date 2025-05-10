// tasksRouter.ts
import { initDataProtectedProcedure, router } from "../trpc";
import { z } from "zod";
import { logger } from "@/server/utils/logger";

import { tasksDB } from "@/server/db/tasks.db";
import { taskUsersDB } from "@/server/db/taskUsers.db";
import { Tasks, TaskUsers } from "@/db/schema";
import { taskTypeEnum } from "@/db/schema/tasks";

/**
 * Merge user status via a single "WHERE taskId IN (..)" DB query
 * from the `users_task` table.
 */
async function mergeUserStatus(tasks: Tasks[], userId: number) {
  if (tasks.length === 0) return tasks;

  const taskIds = tasks.map((t) => t.id);
  // You might implement getUserTasksByUserAndTaskIds in taskUsersDB
  const userTasks = await taskUsersDB.getUserTasksByUserAndTaskIds(userId, taskIds);

  const map = new Map<number, TaskUsers>();
  for (const ut of userTasks) {
    map.set(ut.taskId, {
      status: ut.status,
      pointStatus: ut.pointStatus,
      taskSbt: ut.taskSbt,
      groupSbt: ut.groupSbt,
      createdAt: ut.createdAt,
      updatedAt: ut.updatedAt,
      id: ut.id,
      userId: ut.userId,
      taskId: ut.taskId,
    });
  }

  return tasks.map((task) => ({
    ...task,
    userTaskStatus: map.get(task.id) || null,
  }));
}

export const tasksRouter = router({
  /**
   * Example 1: getTasksByType
   * Input: { taskType, onlyAvailableNow }
   * Returns tasks from tasksDB, merges user status
   */
  getTasksByType: initDataProtectedProcedure
    .input(
      z.object({
        taskType: z.enum(taskTypeEnum.enumValues),
        onlyAvailableNow: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user.user_id;
      const { taskType, onlyAvailableNow } = input;
      try {
        const typedTasks = await tasksDB.getTasksByType(taskType, onlyAvailableNow);
        const tasksWithStatus = await mergeUserStatus(typedTasks, userId);

        return { success: true, tasks: tasksWithStatus };
      } catch (error) {
        logger.error("tasksRouter.getTasksByType error:", error);
        return { success: false, tasks: [], message: "Error fetching tasks by type" };
      }
    }),

  /**
   * Example 2: getTasksByGroup (with manual time filtering or optional param)
   *
   * If you want to also handle date/time in the DB, you could add
   * a "getTasksByGroupIdAndAvailableNow(groupId)" method to tasksDB.
   */
  getTasksByGroup: initDataProtectedProcedure.input(z.object({ groupId: z.number() })).query(async ({ input, ctx }) => {
    const userId = ctx.user.user_id;
    const { groupId } = input;

    try {
      const groupTasks = await tasksDB.getTasksByGroupId(groupId);

      // If you want to filter by "available now" in the code:
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0];

      const validNow = groupTasks.filter((t) => {
        // Basic date/time check. Or do it in tasksDB with a method "getTasksByGroupIdAndAvailableNow"
        if (t.openDate && todayStr < t.openDate.toString().split("T")[0]) return false;
        if (t.closeDate && todayStr > t.closeDate.toString().split("T")[0]) return false;
        if (t.openTime && timeStr < t.openTime) return false;
        if (t.closeTime && timeStr > t.closeTime) return false;
        return true;
      });

      if (validNow.length === 0) {
        return { success: true, tasks: null, message: "No tasks available now in this group" };
      }

      const tasksWithStatus = await mergeUserStatus(validNow, userId);
      return { success: true, tasks: tasksWithStatus };
    } catch (error) {
      logger.error("tasksRouter.getTasksByGroup error:", error);
      return { success: false, tasks: null, message: "Error fetching tasks by group" };
    }
  }),

  /**
   * Example 3: getAvailablePeriodTasks
   * Calls tasksDB.getTasksAvailableNow to handle date/time filtering in DB,
   * merges user status.
   */
  getAvailablePeriodTasks: initDataProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.user_id;

    try {
      const tasksAvail = await tasksDB.getTasksAvailableNow();
      const tasksWithStatus = await mergeUserStatus(tasksAvail, userId);

      return { success: true, tasks: tasksWithStatus };
    } catch (error) {
      logger.error("tasksRouter.getAvailablePeriodTasks error:", error);
      return { success: false, tasks: [], message: "Error fetching available tasks" };
    }
  }),
});
