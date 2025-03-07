import { bigint, index, integer, pgTable, timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel, sql } from "drizzle-orm";

export const affiliateClick = pgTable(
  "affiliate_click",
  {
    id: integer("id").primaryKey().default(sql`nextval
        ('affiliate_click_id_seq'::regclass)`),
    affiliateLinkId: bigint("affiliate_lnk_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { precision: 6 }).notNull(),
  },
  (table) => {
    return {
      affiliateLinkIdIdx: index("affiliate_click_affiliate_link_id_idx").on(table.affiliateLinkId),
      userIdIdx: index("affiliate_click_user_id_idx").on(table.userId),
    };
  }
);

export type AffiliateClickRow = InferSelectModel<typeof affiliateClick>;
