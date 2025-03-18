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
// Add an enum for API names if you want to constrain possible values:
export const apiNameEnum = pgEnum("api_name_enum", ["TONFEST", "TS_API", "PRIDIPIE_API"]);
// Add an enum for item types if you want to constrain possible values:
export const itemTypeEnum = pgEnum("item_type_enum", ["EVENT", "ALL_ITEMS", "EVENT_ORGANIZER"]);
// Add an enum for steps if you want to constrain possible values:
export const stepNameEnum = pgEnum("step_name_enum", [
  "event_created",
  "event_updated",
  "payment_completed",
  "order_completed",
  "event_started",
  "event_ended",
]);
// Add an enum for methods if you want to constrain possible values:
export const httpMethodEnum = pgEnum("http_method_enum", ["GET", "POST", "PUT", "PATCH", "DELETE"]);
export const taskFunctionEnum = pgEnum("task_function_enum", ["addUserTicketFromOnton", "addSbtFromOnton", "PridipieAUTH"]);

export type CallBackTaskFunctionType = "addUserTicketFromOnton" | "addSbtFromOnton" | "PridipieAUTH";
export type CallBackTaskAPINameType = "TONFEST" | "TS_API" | "PRIDIPIE_API";

export interface RetryPolicy {
  max_attempt?: number; // optional
  wait_for_retry?: number; // optional
}

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

    // The method to call on the external API, e.g. "/create_order"
    task_function: taskFunctionEnum("task_function").notNull(),

    // A JSON template for the request body, headers, etc.
    payload_template: json("payload_template"),
    // Storing the method as an enum (GET, POST, etc.)
    method: httpMethodEnum("method").notNull().default("POST"),

    // Storing headers as JSON if you have multiple headers.
    // Example structure: { "Authorization": "Bearer XXX", "Content-Type": "application/json" }
    // headers: json("headers"),
    // Whether this task is active
    active: boolean("active").notNull().default(true),

    // JSON field to store retry rules or settings (if any)
    retry_policy: json("retry_policy").$type<RetryPolicy>().default({
      max_attempt: 5,
      wait_for_retry: 1000,
    }),

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

export type CallBackTaskItemType = (typeof itemTypeEnum.enumValues)[number];
export type CallBackTaskStepNameType = (typeof stepNameEnum.enumValues)[number];
export type CallBackTaskSHttpMethodType = (typeof httpMethodEnum.enumValues)[number];
