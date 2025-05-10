import { boolean, date, integer, jsonb, pgEnum, pgTable, serial, text, time, timestamp, varchar } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { taskSBT } from "@/db/schema/taskSbt";
import { taskGroups } from "./taskGroups";

export const taskPeriodEnum = pgEnum("task_period", ["none", "daily", "weekly", "monthly", "yearly", "custom"]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  groupId: integer("group_id").references(() => taskGroups.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  // Date range
  openDate: date("open_date"),
  closeDate: date("close_date"),

  // Time range
  openTime: time("open_time", { precision: 0 }),
  closeTime: time("close_time", { precision: 0 }),

  // Period / repetition
  period: taskPeriodEnum("period").notNull().default("none"),
  periodInterval: integer("period_interval").notNull().default(1),

  taskType: varchar("task_type", { length: 100 }).notNull(),
  rewardPoint: integer("reward_point").notNull().default(0),

  hasSbt: boolean("has_sbt").notNull().default(false),
  hasGroupSbt: boolean("has_group_sbt").notNull().default(false),
  sbtId: integer("sbt_id").references(() => taskSBT.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  taskConnectedItem: varchar("task_connected_item", { length: 255 }),
  taskConnectedItemTypes: varchar("task_connected_item_types", {
    length: 100,
  }),

  jsonForChecker: jsonb("json_for_checker"),

  createdAt: timestamp("created_at", {
    withTimezone: false,
    precision: 3,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: false,
    precision: 3,
  }),
});

export type Tasks = InferSelectModel<typeof tasks>;
export type TasksInsert = Omit<Tasks, "id" | "createdAt" | "updatedAt">;
export type TaskPeriodType = (typeof taskPeriodEnum.enumValues)[number];
