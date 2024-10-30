import {pgTable, serial, integer, varchar, uuid} from "drizzle-orm/pg-core";

export const specialGuests = pgTable("special_guests", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  surname: varchar("surname", { length: 255 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  telegram: varchar("telegram", { length: 255 }),
  userId: integer("user_id"),
  type: varchar("type", { length: 255 }),
  eventUuid: uuid("event_uuid"),
});
