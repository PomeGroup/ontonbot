// src/server/routers/questRouter.ts
import { router, initDataProtectedProcedure } from "../trpc";
import { z } from "zod";

import { tasksDB } from "@/db/modules/tasks.db";
import { taskUsersDB } from "@/db/modules/taskUsers.db";
import { maybeInsertScoreGeneric } from "@/lib/maybeInsertScoreGeneric";
import { logger } from "@/server/utils/logger";

const DELAY_MS = 30_000;

/* helper: map task → link to open */
function resolveLink(task: NonNullable<Awaited<ReturnType<typeof tasksDB.getTaskById>>>) {
  const cfg = (task.jsonForChecker ?? {}) as any;

  switch (task.taskType) {
    case "start_bot":
      return `https://t.me/${cfg.bot_address ?? "theontonbot"}`;

    case "x_view_post":
    case "x_retweet":
      if (!cfg.x_url) throw new Error("x_url missing");
      return cfg.x_url;

    case "tg_join_channel":
      if (!cfg.channel_username) throw new Error("channel_username missing");
      return `https://t.me/${cfg.channel_username}`;

    case "tg_join_group":
      if (!cfg.group_invite_link) throw new Error("group_invite_link missing");
      return cfg.group_invite_link;

    case "tg_post_view":
      if (!cfg.post_url) throw new Error("post_url missing");
      return cfg.post_url;

    case "open_mini_app":
      if (!cfg.webapp_url) throw new Error("webapp_url missing");
      return cfg.webapp_url;

    default:
      throw new Error(`Quest type '${task.taskType}' unsupported`);
  }
}

export const questRouter = router({
  /* ---------- BEGIN ---------- */
  begin: initDataProtectedProcedure.input(z.object({ taskId: z.number() })).mutation(async ({ ctx, input }) => {
    const { taskId } = input;
    const userId = ctx.user.user_id;

    const task = await tasksDB.getTaskById(taskId);
    if (!task) throw new Error("Task not found");

    /* upsert users_task */
    let ut = await taskUsersDB.getUserTaskByUserAndTask(userId, taskId);
    if (!ut) {
      ut = await taskUsersDB.addUserTask({
        userId,
        taskId,
        status: "in_progress",
        pointStatus: "not_allocated",
        taskSbt: "has_not_sbt",
        groupSbt: "has_not_sbt",
        customData: {},
      });
    }

    return { startBotLink: resolveLink(task) }; // same response key as before
  }),

  /* ---------- CHECK ---------- */
  check: initDataProtectedProcedure.input(z.object({ taskId: z.number() })).query(async ({ ctx, input }) => {
    const { taskId } = input;
    const userId = ctx.user.user_id;

    const task = await tasksDB.getTaskById(taskId);
    if (!task) return { status: "no_task" } as const;

    const ut = await taskUsersDB.getUserTaskByUserAndTask(userId, taskId);
    if (!ut) return { status: "not_started" } as const;
    if (ut.status === "done") return { status: "done" } as const;

    /* 30‑second grace period */
    const elapsed = Date.now() - new Date(ut.createdAt).getTime();
    if (elapsed >= DELAY_MS) {
      await taskUsersDB.updateUserTaskById(ut.id, { status: "done" });
      await maybeInsertScoreGeneric(userId, taskId);
      return { status: "done" } as const;
    }

    return { status: "waiting" } as const;
  }),
});
