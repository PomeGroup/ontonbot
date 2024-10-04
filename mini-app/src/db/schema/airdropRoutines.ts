import { events } from "@/db/schema/events";
import { users } from "@/db/schema/users";
import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
export const airdropRoutines = pgTable(
  "airdrop_routines",
  {
    id: serial("id").primaryKey(),
    event_id: serial("event_id").references(() => events.event_id),
    user_id: bigint("user_id", { mode: "number" }).references(
      () => users.user_id
    ),
    status: text("status"),
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    eventIdIdx: index("airdrop_event_id_idx").on(table.event_id),
    userIdIdx: index("airdrop_user_id_idx").on(table.user_id),
    statusIdx: index("airdrop_status_idx").on(table.status),
    createdAtIdx: index("airdrop_created_at_idx").on(table.created_at),
    updatedAtIdx: index("airdrop_updated_at_idx").on(table.updatedAt),
  })
);

// Relations
export const airdropRoutineRelations = relations(
  airdropRoutines,
  ({ one }) => ({
    event: one(events, {
      fields: [airdropRoutines.event_id],
      references: [events.event_id],
    }),
    user: one(users, {
      fields: [airdropRoutines.user_id],
      references: [users.user_id],
    }),
  })
);
