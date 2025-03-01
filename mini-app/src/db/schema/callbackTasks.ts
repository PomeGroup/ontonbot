import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  serial,
  uuid,
  text,
  boolean,
  json,
  bigint,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                              Enum Definitions                              */
/* -------------------------------------------------------------------------- */
export const apiNameEnum = pgEnum("api_name_enum", ["TONFEST", "TS_API"]);

export const itemTypeEnum = pgEnum("item_type_enum", ["EVENT", "ALL_ITEMS"]);

export const stepNameEnum = pgEnum("step_name_enum", [
  "event_created",
  "event_updated",
  "payment_completed",
  "order_completed",
  "event_completed",
  "event_started",
  "event_ended",
]);

/* -------------------------------------------------------------------------- */
/*                           callback_tasks Table                             */
/* -------------------------------------------------------------------------- */
export const callbackTasks = pgTable(
  "callback_tasks",
  {
    id: serial("id").primaryKey(),
    task_uuid: uuid("task_uuid").defaultRandom().notNull(),

    // The step in your system where this callback is triggered, e.g. "payment_completed"
    step_name: stepNameEnum("step_name").notNull(),

    // The name of the external API or integration (e.g., "TONFEST", "ANOTHER_API")
    api_name: apiNameEnum("api_name").notNull(),

    // The endpoint for the API call (if you want it stored; otherwise keep it in code)
    endpoint: text("endpoint"),

    // A JSON template for the request body, headers, etc.
    payload_template: json("payload_template"),

    // Whether this task is active
    active: boolean("active").notNull().default(true),

    // JSON field to store retry rules or settings (if any)
    retry_policy: json("retry_policy"),

    // Type of item for which this callback applies, e.g. "ORDER", "EVENT"
    item_type: itemTypeEnum("item_type").notNull(),

    // ID of the specific item in your database (could be an event, order, etc.)
    // Using bigint so it can match your existing user/event IDs if they are big integers.
    item_id: bigint("item_id", { mode: "number" }),

    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updated_by: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    // Indexes & unique constraints
    taskUuidIdx: index("callback_tasks_task_uuid_idx").on(table.task_uuid),
    stepNameIdx: index("callback_tasks_step_name_idx").on(table.step_name),
    apiNameIdx: index("callback_tasks_api_name_idx").on(table.api_name),
    itemTypeIdx: index("callback_tasks_item_type_idx").on(table.item_type),
    itemIdIdx: index("callback_tasks_item_id_idx").on(table.item_id),
    taskUuidUnique: uniqueIndex("callback_tasks_task_uuid_unique").on(table.task_uuid),
  })
);

// Drizzle model type
export type CallbackTasksRow = InferSelectModel<typeof callbackTasks>;
export type CallBackTaskAPINameType = (typeof apiNameEnum.enumValues)[number];
export type CallBackTaskItemType = (typeof itemTypeEnum.enumValues)[number];
export type CallBackTaskStepNameType = (typeof stepNameEnum.enumValues)[number];
