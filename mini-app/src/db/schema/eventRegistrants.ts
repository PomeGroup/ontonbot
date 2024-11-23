import { sql } from "drizzle-orm";
import { users } from "@/db/schema/users";
import { events } from "@/db/schema/events";
import {
  bigint,
  pgTable,
  serial,
  uuid,
  text,
  check,
  uniqueIndex,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const eventRegistrantStatus = pgEnum("registrant_status", [
  "pending",
  "rejected",
  "approved",
]);

export const eventRegistrants = pgTable(
  "event_registrants",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid").references(() => events.event_uuid),
    user_id: bigint("user_id", { mode: "number" }).references(
      () => users.user_id
    ),

    status: eventRegistrantStatus("status").default("pending").notNull(),

    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    uniqueEventUser: uniqueIndex().on(table.event_uuid, table.user_id),
    statusCheck: check(
      "valid_status",
      sql`${table.status} IN ('pending', 'rejected', 'approved')`
    ),
  })
);
