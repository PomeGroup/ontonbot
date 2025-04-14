import { db } from "@/db/db";
import { and, eq } from "drizzle-orm";
import { play2winCampaigns, Play2WinCampaignsRow, Play2WinCampaignType } from "@/db/schema/play2winCampaigns";

export async function getPlay2WinCampaignRow(
  userId: number,
  campaignType: Play2WinCampaignType
): Promise<Play2WinCampaignsRow | null> {
  const [row] = await db
    .select()
    .from(play2winCampaigns)
    .where(and(eq(play2winCampaigns.userId, userId), eq(play2winCampaigns.campaignType, campaignType)));
  return row ?? null;
}

const play2winCampaignsDB = {
  getPlay2WinCampaignRow,
};
export default play2winCampaignsDB;
