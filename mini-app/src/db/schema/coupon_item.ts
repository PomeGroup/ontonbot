import { index, integer, pgTable, serial, timestamp, uuid, pgEnum, text } from "drizzle-orm/pg-core";
import { events } from "@/db/schema/events";
import { coupon_definition } from "./coupon_definition";

export const coupon_item_status = pgEnum("coupon_item_status", ["used", "unused"]);

export const coupon_items = pgTable(
  "coupon_items",
  {
    id: serial("id").primaryKey(),

    // "onDelete: 'cascade'" causes coupon_items rows to be deleted automatically if the event is deleted
    event_uuid: uuid("event_uuid").references(() => events.event_uuid, {
      onDelete: "cascade",
      onUpdate: "cascade", // optional
    }),

    // Similarly, if the coupon_definition row is deleted, all related coupon_items rows will be deleted automatically
    coupon_definition_id: integer("coupon_definition_id")
      .references(() => coupon_definition.id, {
        onDelete: "cascade",
        onUpdate: "cascade", // optional
      })
      .notNull(),

    code: text("code").notNull(),
    coupon_status: coupon_item_status("coupon_status").notNull().default("unused"),

    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
  },
  (table) => ({
    couponItemEventUuidIdx: index("coupon_items_event_uuid_idx").on(table.event_uuid),
    couponItemsCodeIdx: index("coupon_items_code_idx").on(table.code),
    couponItemsCouponStatusIdx: index("coupon_items_coupon_status_idx").on(table.coupon_status),
    couponItemsGroupIdIdx: index("coupon_items_group_id_idx").on(table.coupon_definition_id),
  })
);
