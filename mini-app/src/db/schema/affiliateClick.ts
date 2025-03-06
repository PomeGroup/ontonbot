import { bigint, index, integer, pgTable, timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const affiliateClick = pgTable(
  "affiliate_click",
  {
    id: integer("id").primaryKey(),
    affiliate_link_id: bigint("affiliate_lnk_id", { mode: "number" }).notNull(),
    user_id: bigint("user_id", { mode: "number" }).notNull(),
    created_at: timestamp("created_at", { precision: 6 }).notNull(),
  },
  (table) => {
    return {
      affiliateLinkIdIdx: index("affiliate_click_affiliate_link_id_idx").on(table.affiliate_link_id),
      userIdIdx: index("affiliate_click_user_id_idx").on(table.user_id),
    };
  }
);

export type AffiliateClickRow = InferSelectModel<typeof affiliateClick>;
