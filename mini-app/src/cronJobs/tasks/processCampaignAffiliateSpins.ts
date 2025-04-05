import { db } from "@/db/db";
import { affiliateLinksDB } from "@/server/db/affiliateLinks.db";
import { tokenCampaignOrdersDB } from "@/server/db/tokenCampaignOrders.db";
import { tokenCampaignUserSpinsDB } from "@/server/db/tokenCampaignUserSpins.db";
import { logger } from "@/server/utils/logger";
import { AffiliateItemTypeEnum } from "@/db/schema/affiliateLinks";
import { TokenCampaignUserSpinsInsert } from "@/db/schema/tokenCampaignUserSpins";
import { notifyUserOfAffiliateReward } from "../helper/notifyUserOfAffiliateReward";

/**
 * Cron job: awarding spins for onion1-campaign affiliates
 */
export async function processCampaignAffiliateSpins() {
  const currentCampaign: AffiliateItemTypeEnum = "onion1-campaign";
  const goldenCollectionForReward = 1;

  try {
    // 1) fetch links
    const onionLinks = await affiliateLinksDB.getAffiliateLinkByType(currentCampaign);
    if (!onionLinks || onionLinks.length === 0) {
      return;
    }

    for (const link of onionLinks) {
      const totalPurchasedSpins = await tokenCampaignOrdersDB.sumSpinCountByAffiliateHash(link.linkHash);
      const previouslyAwarded = link.totalPurchase || 0;

      if (totalPurchasedSpins > previouslyAwarded) {
        logger.log(
          `processCampaignAffiliateSpins: Awarding spins for affiliate link #${link.id} for user #${link.affiliatorUserId}`
        );
        await db.transaction(async (tx) => {
          const newSpinsRows: TokenCampaignUserSpinsInsert[] = [];

          // for i in range (previouslyAwarded+1 ... totalPurchasedSpins)
          for (let i = previouslyAwarded + 1; i <= totalPurchasedSpins; i++) {
            // If multiple of 20 => only specific_reward
            if (i % 20 === 0) {
              newSpinsRows.push({
                userId: link.affiliatorUserId,
                spinType: "specific_reward",
                spinPackageId: -1,
                spinIndex: 1,
                nftCollectionId: goldenCollectionForReward,
              });
              logger.log(`processCampaignAffiliateSpins: Awarding specific_reward to user #${link.affiliatorUserId}`);
              // after push, also notify
              await notifyUserOfAffiliateReward(link.affiliatorUserId, "specific_reward");
              logger.log(`processCampaignAffiliateSpins: Notified user #${link.affiliatorUserId} of specific_reward`);
            }
            // else if multiple of 5 => rewarded_spin
            else if (i % 5 === 0) {
              newSpinsRows.push({
                userId: link.affiliatorUserId,
                spinType: "rewarded_spin",
                spinPackageId: -1,
                spinIndex: 1,
                nftCollectionId: null,
              });
              logger.log(`processCampaignAffiliateSpins: Awarding rewarded_spin to user #${link.affiliatorUserId}`);
              // after push, also notify
              await notifyUserOfAffiliateReward(link.affiliatorUserId, "rewarded_spin");
              logger.log(`processCampaignAffiliateSpins: Notified user #${link.affiliatorUserId} of rewarded_spin`);
            }
          }

          // insert new spins
          if (newSpinsRows.length > 0) {
            for (const rowData of newSpinsRows) {
              await tokenCampaignUserSpinsDB.addUserSpinTx(tx, rowData);
              logger.log(`processCampaignAffiliateSpins: Added user spin for user #${rowData.userId}`);
            }
            logger.log(
              `processCampaignAffiliateSpins: Awarded ${newSpinsRows.length} new spins to user #${link.affiliatorUserId} on affiliate link #${link.id}`
            );
          }

          // update link's total
          const incrementRewarded = totalPurchasedSpins - previouslyAwarded;
          await affiliateLinksDB.incrementAffiliatePurchase(link.linkHash, incrementRewarded);
          logger.log(
            `processCampaignAffiliateSpins: Updated totalPurchase for link #${link.linkHash} by ${incrementRewarded}`
          );
        });
      }
    }
  } catch (error) {
    logger.error("processCampaignAffiliateSpins: Error in processAffiliateSpins:", error);
  }
}
