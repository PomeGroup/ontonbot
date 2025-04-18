import { pgTable, serial, bigint, text, timestamp, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const play2winCampaignType = pgEnum("play2win_campaign_type", ["genesis_onion"]);
// The campaignType might be an enum, or a text column. Here we assume "genesis_onion" is the only one needed now.
export const play2winCampaigns = pgTable(
  "play2win_campaigns",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    campaignType: play2winCampaignType("campaign_type").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // userId + campaignType must be unique
    userCampaignUnique: uniqueIndex("play2win_campaigns_user_campaign_idx").on(table.userId, table.campaignType),
  })
);

// Types for SELECT & INSERT
export type Play2WinCampaignsRow = InferSelectModel<typeof play2winCampaigns>;

/** Omit auto-generated columns from Insert */
export type Play2WinCampaignsInsert = Omit<Play2WinCampaignsRow, "id" | "createdAt">;

// Type for the campaign type
export type Play2WinCampaignType = (typeof play2winCampaignType.enumValues)[number];
