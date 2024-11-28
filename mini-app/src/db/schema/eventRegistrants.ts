import { sql } from "drizzle-orm";
import { users } from "@/db/schema/users";
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
  jsonb,
} from "drizzle-orm/pg-core";

export const eventRegistrantStatus = pgEnum("registrant_status", [
  "pending",
  "rejected",
  "approved",
  "checkedin",
]);

export const eventRegistrants = pgTable(
  "event_registrants",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid"),
    user_id: bigint("user_id", { mode: "number" }).references(() => users.user_id),

    status: eventRegistrantStatus("status").default("pending").notNull(),
    register_info: jsonb("register_info").notNull().default({}),

    registrant_uuid: uuid("registrant_uuid")
      .unique()
      .notNull()
      .default(sql`gen_random_uuid()`),

    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    uniqueEventUser: uniqueIndex().on(table.event_uuid, table.user_id),
    statusCheck: check("valid_status", sql`${table.status} IN ('pending', 'rejected', 'approved')`),
  })
);
