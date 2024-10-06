import {bigint, boolean, index, integer, pgTable, serial, text, timestamp, unique} from "drizzle-orm/pg-core";
import {users} from "@/db/schema/users";
import {events} from "@/db/schema/events";
import {eventFields} from "@/db/schema/eventFields";
import {relations} from "drizzle-orm";
export const userEventFields = pgTable(
    "user_event_fields",
    {
        id: serial("id").primaryKey(),
        event_field_id: serial("event_field_id").references(() => eventFields.id),
        event_id: integer("event_id")
            .references(() => events.event_id)
            .notNull(),
        user_id: bigint("user_id", { mode: "number" }).references(
            () => users.user_id
        ),
        data: text("data"),
        completed: boolean("completed"),
        created_at: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at", {
            mode: "date",
            precision: 3,
        }).$onUpdate(() => new Date()),
        updatedBy: text("updated_by").default("system").notNull(),
    },
    (table) => ({
        unq: unique().on(table.event_field_id, table.user_id),
        eventId: index("uef_event_id_idx").on(table.event_id),
        eventFieldIdIdx: index("uef_event_field_id_idx").on(table.event_field_id),
        userIdIdx: index("uef_user_id_idx").on(table.user_id),
        completedIdx: index("uef_completed_idx").on(table.completed),
        createdAtIdx: index("uef_created_at_idx").on(table.created_at),
        updatedAtIdx: index("uef_updated_at_idx").on(table.updatedAt),
    })
);

// Relations

export const userEventFieldRelations = relations(userEventFields, ({ one }) => ({
  eventField: one(eventFields, {
    fields: [userEventFields.event_field_id],
    references: [eventFields.id],
  }),
  user: one(users, {
    fields: [userEventFields.user_id],
    references: [users.user_id],
  }),
}));
