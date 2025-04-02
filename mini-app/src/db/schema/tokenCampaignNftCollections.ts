import { pgTable, varchar, jsonb, bigint, serial, timestamp, text, index } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { campaignTypes } from "@/db/enum";

export const tokenCampaignNftCollections = pgTable(
  "token_campaign_nft_collections",
  {
    id: serial("id").notNull().primaryKey(),
    campaignType: campaignTypes("campaign_type").notNull(),
    probabilityWeight: bigint("probability_weight", { mode: "number" }).notNull(),
    name: varchar("name", { length: 255 }),
    description: varchar("description", { length: 500 }),
    image: varchar("image", { length: 255 }),
    socialLinks: varchar("social_links", { length: 255 }),
    address: varchar("address", { length: 255 }),
    metadataUrl: varchar("metadata_url", { length: 255 }),
    itemMetaData: jsonb("item_meta_data"),
    lastRegisteredItemIndex: bigint("last_registered_item_index", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  // indexes
  (table) => ({
    addressIdx: index("address_idx").on(table.address),
    nameIdx: index("name_idx").on(table.name),
    lastRegisteredItemIndexIdx: index("last_registered_item_index_idx").on(table.lastRegisteredItemIndex),
  })
);

/**
 * SELECT type
 * Represents the shape of a row *selected* from the table.
 */
export type TokenCampaignNftCollections = InferSelectModel<typeof tokenCampaignNftCollections>;

/**
 * INSERT type
 * Omit columns that:
 *   1) are auto-generated (e.g., `id`).
 *   2) have default values you typically don't supply (e.g., `createdAt`, `updatedAt`).
 */
export type TokenCampaignNftCollectionsInsert = Omit<
  InferSelectModel<typeof tokenCampaignNftCollections>,
  "id" | "createdAt" | "updatedAt" | "updatedBy"
>;
