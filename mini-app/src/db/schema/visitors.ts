import { bigint, index, integer, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/db/schema/users";
import { events } from "@/db/schema/events";
import { infer } from "zod";
import { InferSelectModel } from "drizzle-orm";

export const visitors = pgTable(
  "visitors",
  {
    id: serial("id").primaryKey(),
    user_id: bigint("user_id", { mode: "number" }).references(() => users.user_id),
    event_uuid: uuid("event_uuid")
      .references(() => events.event_uuid)
      .notNull(),
    claimed: integer("claimed"),
    amount: integer("amount"),
    tx_hash: text("tx_hash"),
    last_visit: timestamp("last_visit").defaultNow(),
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    userIdIdx: index("visitors_user_id_idx").on(table.user_id),
    eventUuidIdx: index("visitors_event_uuid_idx").on(table.event_uuid),
    lastVisitIdx: index("visitors_last_visit_idx").on(table.last_visit),
    createdAtIdx: index("visitors_created_at_idx").on(table.created_at),
    updatedAtIdx: index("visitors_updated_at_idx").on(table.updatedAt),
  })
);

export type VisitorsRow = InferSelectModel<typeof visitors>;
