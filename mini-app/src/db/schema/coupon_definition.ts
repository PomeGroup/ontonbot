import { index, integer, pgTable, serial, timestamp, uuid, pgEnum, numeric } from "drizzle-orm/pg-core";
import { events } from "@/db/schema/events";

export const coupon_definition_type = pgEnum("coupon_definition_type", ["percent", "fixed"]);
export const coupon_definition_status = pgEnum("coupon_definition_status", ["active", "inactive", "expired"]);

export const coupon_definition = pgTable(
  "coupon_definition",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid")
      .references(() => events.event_uuid, {
        onDelete: "cascade", // when the referenced event is deleted, delete this row
        onUpdate: "cascade", // when the event_uuid changes, update this foreign key
      })
      .$type<string>(),

    cpd_type: coupon_definition_type("coupon_type").notNull(),
    cpd_status: coupon_definition_status("status").notNull(),
    value: numeric("value", { precision: 8, scale: 3 }).notNull().$type<number>(),

    start_date: timestamp("start_date").notNull(),
    end_date: timestamp("end_date").notNull(),

    count: integer("count").notNull(),
    used: integer("used").notNull(),

    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
  },
  (table) => ({
    couponDefinitionEventUuidIdx: index("coupon_definition_event_uuid_idx").on(table.event_uuid),
    couponDefinitionCountIdx: index("coupon_definition_count_idx").on(table.count),
    couponDefinitionStartDateEndDateIdx: index("coupon_definition_start_date_end_date_idx").on(
      table.start_date,
      table.end_date
    ),
    couponDefinitionStatusIdx: index("coupon_definition_status_idx").on(table.cpd_status),
    couponDefinitionTypeIdx: index("coupon_definition_type_idx").on(table.cpd_type),
    couponDefinitionUsedIdx: index("coupon_definition_used_idx").on(table.used),
  })
);

