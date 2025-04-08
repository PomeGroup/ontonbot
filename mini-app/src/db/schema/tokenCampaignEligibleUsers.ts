import { pgTable, bigint, timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const tokenCampaignEligibleUsers = pgTable("token_campaign_eligible_users", {
  userTelegramId: bigint("user_telegram_id", { mode: "number" }).notNull().primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TokenCampaignEligibleUsers = InferSelectModel<typeof tokenCampaignEligibleUsers>;
