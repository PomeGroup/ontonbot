import { index, integer, json, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { rewardStatus, rewardType } from "@/db/schema";
import { visitors } from "@/db/schema/visitors";
import { InferSelectModel } from "drizzle-orm";

export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitor_id: serial("visitor_id")
      .references(() => visitors.id)
      .notNull(),
    type: rewardType("type"),
    data: json("data"),
    tryCount: integer("try_count").default(0).notNull(),
    status: rewardStatus("status").notNull().default("created"),
    created_at: timestamp("created_at").defaultNow(),
    event_start_date: integer("event_start_date").notNull(),
    event_end_date: integer("event_end_date").notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    visitorIdIdx: index("rewards_visitor_id_idx").on(table.visitor_id),
    typeIdx: index("rewards_type_idx").on(table.type),
    statusIdx: index("rewards_status_idx").on(table.status),
    createdAtIdx: index("rewards_created_at_idx").on(table.created_at),
    updatedAtIdx: index("rewards_updated_at_idx").on(table.updatedAt),
  })
);

export type RewardsSelectType = InferSelectModel<typeof rewards>;
