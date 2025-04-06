import { pgTable, bigint, varchar, serial, timestamp, text, index } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema/users";

export const tokenCampaignUserCollections = pgTable(
  "token_campaign_user_collections",
  {
    id: serial("id").notNull().primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id),
    collectionId: bigint("collection_id", { mode: "number" }).notNull(),
    method: varchar("method", { length: 255 }),
    methodDetailId: bigint("method_detail_id", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  // indexes
  (table) => ({
    userIdIdx: index("tcuc_user_id_idx").on(table.userId),
    collectionIdIdx: index("tcuc_collection_id_idx").on(table.collectionId),
  })
);

/**
 * SELECT type
 * Represents the shape of a row *selected* from the table.
 */
export type TokenCampaignUserCollections = InferSelectModel<typeof tokenCampaignUserCollections>;

/**
 * INSERT type
 * Omit columns that:
 *   1) are auto-generated (e.g., `id`).
 *   2) have default values you typically don't supply (e.g., `createdAt`, `updatedAt`).
 */
export type TokenCampaignUserCollectionsInsert = Omit<
  InferInsertModel<typeof tokenCampaignUserCollections>,
  "id" | "createdAt" | "updatedAt"
>;
