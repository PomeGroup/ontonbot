import { InferSelectModel } from "drizzle-orm";
import { pgTable, serial, uuid, text, json, timestamp, index, uniqueIndex, integer, pgEnum } from "drizzle-orm/pg-core";
import { callbackTasks } from "@/db/schema/callbackTasks";

/* -------------------------------------------------------------------------- */
/*                            Enum Definitions                                */
/* -------------------------------------------------------------------------- */
export const callbackTaskRunStatusEnum = pgEnum("callback_task_run_status_enum", [
  "PENDING",
  "SUCCESS",
  "FAILURE",
  // Add more statuses if needed, e.g. "RETRYING", "CANCELED", etc.
]);

/* -------------------------------------------------------------------------- */
/*                           callback_task_runs Table                         */
/* -------------------------------------------------------------------------- */
export const callbackTaskRuns = pgTable(
  "callback_task_runs",
  {
    id: serial("id").primaryKey(),
    run_uuid: uuid("run_uuid").defaultRandom().notNull(),

    // FK to callback_tasks.id
    callback_task_id: integer("callback_task_id")
      .notNull()
      .references(() => callbackTasks.id),

    // Uses the enum for valid status values
    status: callbackTaskRunStatusEnum("status").notNull().default("PENDING"),

    // The actual payload sent during this particular run
    payload: json("payload"),

    // The raw response (or any relevant data) received from the external system
    response: json("response"),

    // How many times this run has been attempted (useful for retries)
    attempts: integer("attempts").notNull().default(0),

    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updated_by: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    runUuidIdx: index("callback_task_runs_run_uuid_idx").on(table.run_uuid),
    callbackTaskIdIdx: index("callback_task_runs_callback_task_id_idx").on(table.callback_task_id),
    runUuidUnique: uniqueIndex("callback_task_runs_run_uuid_unique").on(table.run_uuid),
  })
);

export type CallbackTaskRunsRow = InferSelectModel<typeof callbackTaskRuns>;
export type callbackTaskRunStatusType = (typeof callbackTaskRunStatusEnum.enumValues)[number];
