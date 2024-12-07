import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { eventPoaResultStatus } from "@/db/schema";
import { users } from "./users";
import { eventPoaTriggers } from "@/db/schema";
import { events  } from "@/db/schema";


export const eventPoaResults = pgTable("event_poa_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.user_id, { onDelete: "no action" }),
  poaId: integer("poa_id").references(() => eventPoaTriggers.id, { onDelete: "no action" }),
  eventId: integer("event_id").references(() => events.event_id, { onDelete: "no action" }),
  poaAnswer: varchar("poa_answer", { length: 255 }),
  status: eventPoaResultStatus("status"), // Use the Enum type here
  repliedAt: timestamp("replied_at", { precision: 6 }),
  notificationId: integer("notification_id"),
});

export const eventPoaResultsIndexes = {
  poaAnswerIndex: { columns: [eventPoaResults.poaAnswer], type: "btree" },
  statusIndex: { columns: [eventPoaResults.status], type: "btree" },
  userIdPoaIdEventIdIndex: {
    columns: [eventPoaResults.userId, eventPoaResults.poaId, eventPoaResults.eventId],
    type: "btree",
  },
};