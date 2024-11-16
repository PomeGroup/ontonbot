import { pgTable, uuid, serial, unique } from "drizzle-orm/pg-core";
import { events } from "./events";

export const sideEvents = pgTable(
  "side_events",
  {
    id: serial("id").primaryKey(),
    main_uuid: uuid("main_uuid")
      .notNull()
      .references(() => events.event_uuid),
    side_uuid: uuid("side_uuid")
      .notNull()
      .references(() => events.event_uuid),
  },
  (table) => {
    return {
      unq: unique().on(table.main_uuid, table.side_uuid),
    };
  }
);
