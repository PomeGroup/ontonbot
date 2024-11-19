import { integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const sbtRewardCollections = pgTable("sbt_reward_collections", {
  id: serial("id").primaryKey(),
  hubID: integer("hubID"),
  hubName: varchar("hubName"),
  videoLink: varchar("videoLink"),
  imageLink: varchar("imageLink"),
});
