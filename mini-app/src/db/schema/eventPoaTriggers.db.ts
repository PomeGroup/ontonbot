import { integer, pgTable, serial, timestamp, smallint, pgSequence } from "drizzle-orm/pg-core";
import { eventTriggerType, eventTriggerStatus ,events } from "@/db/schema";
import { sql } from "drizzle-orm";
// Define the sequence
export const eventPoaTriggersIdSequence = pgSequence("event_poa_results_id", {
  increment: 1,
  minValue: 1,
  maxValue: "9223372036854775807",
  startWith: 1,
  cache: 1,
  cycle: false
});

export const eventPoaTriggers = pgTable("event_poa_triggers", {
  id: serial("id").primaryKey().default(sql`nextval('${eventPoaTriggersIdSequence.seqName}'::regclass)`),
  eventId: integer("event_id").references(() => events.event_id, { onDelete: "cascade" }),
  poaOrder: smallint("poa_order"),
  startTime: integer("start_time"),
  countOfSent: integer("count_of_sent"),
  countOfSuccess: integer("count_of_success"),
  poaType: eventTriggerType("poa_type").default("simple"),
  status: eventTriggerStatus("status").default("active"),
  createdAt: timestamp("created_at", { precision: 6 }),
  updatedAt: timestamp("updated_at", { precision: 6 }),
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
};
