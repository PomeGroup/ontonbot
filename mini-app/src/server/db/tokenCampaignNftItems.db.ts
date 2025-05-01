import { db } from "@/db/db";
import { eq, inArray ,and } from "drizzle-orm";
import { tokenCampaignNftItems } from "@/db/schema/tokenCampaignNftItems";
import { tokenCampaignNftCollections } from "@/db/schema/tokenCampaignNftCollections";
import { tokenCampaignUserSpins } from "@/db/schema/tokenCampaignUserSpins";

const getItemsByAddresses = async (nftAddresses: string[]) => {
  if (!nftAddresses.length) return [];

  const result = await db
    .select({
      nftItem: {
        itemId: tokenCampaignNftItems.itemId,
        itemType: tokenCampaignNftItems.itemType,
        nftAddress: tokenCampaignNftItems.nftAddress,
        index: tokenCampaignNftItems.index,
        owner: tokenCampaignNftItems.owner,
        mergeStatus: tokenCampaignNftItems.mergeStatus,
      },

      // Only columns we want from token_campaign_nft_collections
      collection: {
        id: tokenCampaignNftCollections.id,
        name: tokenCampaignNftCollections.name,
        campaignType: tokenCampaignNftCollections.campaignType,
        address: tokenCampaignNftCollections.address,
        image: tokenCampaignNftCollections.image,
      },
    })
    .from(tokenCampaignNftItems)
    .innerJoin(tokenCampaignUserSpins, eq(tokenCampaignUserSpins.id, tokenCampaignNftItems.itemId))
    .innerJoin(tokenCampaignNftCollections, eq(tokenCampaignNftCollections.id, tokenCampaignUserSpins.nftCollectionId))
    .where(and(inArray(tokenCampaignNftItems.nftAddress, nftAddresses),eq(tokenCampaignNftItems.itemType, "onion1")))

  return result;
  // each row looks like { nftItem: {...}, collection: {...} }
};
export const tokenCampaignNftItemsDB = {
  getItemsByAddresses,
};
