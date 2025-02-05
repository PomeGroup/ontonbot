import { integer, pgTable, serial, timestamp, smallint, bigint } from "drizzle-orm/pg-core";
import { eventTriggerType, eventTriggerStatus, events } from "@/db/schema";

export const eventPoaTriggers = pgTable("event_poa_triggers", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.event_id, { onDelete: "cascade" }),
  poaOrder: smallint("poa_order"),
  startTime: integer("start_time"),
  countOfSent: integer("count_of_sent"),
  countOfSuccess: integer("count_of_success"),
  poaType: eventTriggerType("poa_type").default("simple"),
  status: eventTriggerStatus("status").default("active"),
  createdAt: timestamp("created_at", { precision: 6 }),
  updatedAt: timestamp("updated_at", { precision: 6 }),
  creator_user_id: bigint("creator_user_id", { mode: "number" }),
});

export const eventPoaTriggersIndexes = {
  eventIdIndex: { columns: [eventPoaTriggers.eventId], type: "hash" },
  eventIdPoaOrderStatusIndex: {
    columns: [eventPoaTriggers.eventId, eventPoaTriggers.poaOrder, eventPoaTriggers.status],
    type: "btree",
  },
  eventIdStartTimeIndex: {
    columns: [eventPoaTriggers.eventId, eventPoaTriggers.startTime],
    type: "btree",
  },
  startTimeIndex: { columns: [eventPoaTriggers.startTime], type: "hash" },
  statusIndex: { columns: [eventPoaTriggers.status], type: "btree" },
};
