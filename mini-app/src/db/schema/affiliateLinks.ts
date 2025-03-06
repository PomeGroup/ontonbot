import { pgTable, bigint, boolean, varchar, date, index, uniqueIndex } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { InferSelectModel, sql } from "drizzle-orm";

export const affiliateItemType = pgEnum("affiliate_item_type", ["EVENT", "HOME"]);

export const affiliateLinks = pgTable(
  "affiliate_links",
  {
    id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval
        ('affiliate_links_id_seq'::regclass)`),
    Item_id: bigint("Item_id", { mode: "number" }).notNull(),
    item_type: affiliateItemType("item_type").notNull(),
    creator_user_id: bigint("creator_user_id", { mode: "number" }).notNull(),
    link_hash: varchar("link_hash", { length: 255 }).notNull(),
    total_clicks: bigint("total_clicks", { mode: "number" }).default(0),
    total_purchase: bigint("total_purchase", { mode: "number" }).default(0),
    active: boolean("active").notNull().default(true),
    affiliator_user_id: bigint("affiliator_user_id", { mode: "number" }).notNull(),
    created_at: date("created_at").notNull(),
    updated_at: date("updated_at"),
  },
  (table) => {
    return {
      linkHashUnique: uniqueIndex("affiliate_links_link_hash_key").on(table.link_hash),
      itemTypeIdx: index("affiliate_links_Item_id_item_type_idx").on(table.Item_id, table.item_type),
      affiliatorUserIdIdx: index("affiliate_links_affiliator_user_id_idx").on(table.affiliator_user_id),
      creatorUserIdIdx: index("affiliate_links_creator_user_id_idx").on(table.creator_user_id),
    };
  }
);

export type AffiliateLinksRow = InferSelectModel<typeof affiliateLinks>;
export type AffiliateItemTypeEnum = (typeof affiliateItemType.enumValues)[number];
