import { db } from "@/db/db";
import { tokenCampaignUserSpins } from "@/db/schema/tokenCampaignUserSpins";
import { tokenCampaignOrders } from "@/db/schema/tokenCampaignOrders";
import { TokenCampaignNftItemMetaData, tokenCampaignNftCollections } from "@/db/schema/tokenCampaignNftCollections";
import { tokenCampaignNftItems } from "@/db/schema/tokenCampaignNftItems";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { mintNFT } from "@/lib/nft"; // your existing helper
import { uploadJsonToMinio } from "@/lib/minioTools";

export async function mintNftForUserSpins() {
  // 1) Find user spins that require minting.
  const spinsToMint = await db
    .select()
    .from(tokenCampaignUserSpins)
    .where(and(isNotNull(tokenCampaignUserSpins.nftCollectionId), eq(tokenCampaignUserSpins.isMinted, false)))
    .orderBy(desc(tokenCampaignUserSpins.createdAt))
    .execute();

  if (spinsToMint.length === 0) {
    logger.log("No user spins to mint right now.");
    return;
  }

  // 2) Iterate over each spin and attempt to mint
  for (const spin of spinsToMint) {
    // Wrap in a transaction
    await db.transaction(async (trx) => {
      // 2a) Re-fetch spin in transaction
      const [freshSpin] = await trx
        .select()
        .from(tokenCampaignUserSpins)
        .where(eq(tokenCampaignUserSpins.id, spin.id))
        .execute();

      if (!freshSpin) {
        logger.error(`Spin not found or already handled: spinId=${spin.id}`);
        return;
      }
      logger.log(`Processing spinId=${spin.id} for userId=${freshSpin.userId}`, spin);

      // 3) Look up the related collection
      const [collection] = await trx
        .select()
        .from(tokenCampaignNftCollections)
        .where(eq(tokenCampaignNftCollections.id, freshSpin.nftCollectionId!))
        .execute();

      if (!collection) {
        logger.error(`No collection found for spinId=${spin.id}, collectionId=${freshSpin.nftCollectionId}`);
        return;
      }

      if (!collection.address) {
        logger.error(`Collection ${collection.id} missing on-chain address. Cannot mint spinId=${spin.id}.`);
        return;
      }
      if (!collection?.name || !collection?.description || !collection?.image) {
        logger.error(`Collection ${collection.id} missing required fields. Cannot mint spinId=${spin.id}.`, collection);
        return;
      }
      logger.log(`Collection found for spinId=${spin.id}:`, collection);

      // 4) Retrieve the user’s wallet address from orders
      const [order] = await trx
        .select({
          wallet: tokenCampaignOrders.wallet_address,
          uuid: tokenCampaignOrders.uuid,
        })
        .from(tokenCampaignOrders)
        .where(
          and(
            eq(tokenCampaignOrders.userId, freshSpin.userId),
            isNotNull(tokenCampaignOrders.wallet_address),
            eq(tokenCampaignOrders.status, "completed")
          )
        )
        .orderBy(desc(tokenCampaignOrders.createdAt))
        .limit(1)
        .execute();

      if (!order?.wallet) {
        logger.error(`No wallet address found for userId=${freshSpin.userId}, spinId=${spin.id}`);
        return;
      }

      const walletAddress = order.wallet.trim();
      logger.log(`Minting spinId=${spin.id} for userId=${freshSpin.userId} to wallet=${walletAddress}`);

      // 5) Determine the next NFT index
      const nextIndex = (collection.lastRegisteredItemIndex ?? 0) + 1;
      logger.log(
        `Next index for collection ${collection.id} is ${nextIndex} for spinId=${spin.id} and userId=${freshSpin.userId}`
      );

      // 6) Build final NFT metadata by merging:
      //    - collection.itemMetaData
      //    - fallback from collection name/description/image
      //    - spin-specific "spin_id"
      //    We'll store result in `finalItemData`.
      const baseItemData = (collection.itemMetaData as TokenCampaignNftItemMetaData) ?? {};
      // If itemMetaData already has "name", it will override. Otherwise fallback:
      const finalItemData = {
        name: baseItemData.name ?? collection.name,
        description: baseItemData.description ?? collection.description,
        image: baseItemData.image ?? collection.image,
        // Merge optional fields from itemMetaData
        animation_url: baseItemData.animation_url,
        content_url: baseItemData.content_url,
        content_type: baseItemData.content_type,
        cover_image: baseItemData.cover_image,
        social_links: baseItemData.social_links,
        links: baseItemData.links,
        buttons: baseItemData.buttons,
        // Merge attributes, plus spin_id:
        attributes: {
          ...baseItemData.attributes,
          spin_id: freshSpin.id, // inject the spin_id attribute
        },
      };

      // 7) Upload finalItemData to Minio
      logger.log("Final NFT item data:", finalItemData);
      const meta_data_url = await uploadJsonToMinio(finalItemData, "ontonitem");
      if (!meta_data_url) {
        logger.error(`Failed to upload metadata for spinId=${spin.id} and userId=${freshSpin.userId}`);
        return;
      }
      logger.log(`Uploaded metadata for spinId=${spin.id} to ${meta_data_url}`);

      // 8) Mint the NFT
      const nftAddressOnChain = await mintNFT(
        walletAddress, // user’s address
        collection.address, // the collection address on-chain
        nextIndex, // item index
        meta_data_url // URL to your JSON metadata
      );

      if (!nftAddressOnChain) {
        logger.error(`Mint returned null for spinId=${spin.id}. Possibly failed on-chain.`);
        throw new Error(`Failed to mint NFT for spinId=${spin.id}`);
      }

      // 9) Update DB
      // 9a) Bump lastRegisteredItemIndex
      await trx
        .update(tokenCampaignNftCollections)
        .set({ lastRegisteredItemIndex: nextIndex })
        .where(eq(tokenCampaignNftCollections.id, collection.id))
        .execute();

      // 9b) Mark spin as minted
      await trx
        .update(tokenCampaignUserSpins)
        .set({ isMinted: true })
        .where(eq(tokenCampaignUserSpins.id, freshSpin.id))
        .execute();

      // 9c) Insert a record in `token_campaign_nft_items`
      await trx
        .insert(tokenCampaignNftItems)
        .values({
          itemId: freshSpin.id,
          itemType: collection.campaignType,
          nftAddress: nftAddressOnChain,
          index: nextIndex,
          collectionAddress: collection.address,
          owner: freshSpin.userId,
        })
        .execute();

      logger.log(`Minted spinId=${spin.id} => NFT ${nftAddressOnChain}`);
    });
    // Remove or keep this break depending on whether you only want to mint the first spin
    break;
  }
}
