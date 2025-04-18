import { db } from "@/db/db";
import { tokenCampaignUserSpins } from "@/db/schema/tokenCampaignUserSpins";
import { tokenCampaignOrders } from "@/db/schema/tokenCampaignOrders";
import { tokenCampaignNftCollections } from "@/db/schema/tokenCampaignNftCollections";
import { tokenCampaignNftItems } from "@/db/schema/tokenCampaignNftItems";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { logger } from "@/server/utils/logger";

// Your existing helper:
import { mintNFT } from "@/lib/nft";
import { uploadJsonToMinio } from "@/lib/minioTools";

export async function mintNftForUserSpins() {
  // 1) Find user spins that require minting.
  //    For example, those with a non-null nftCollectionId.also filter out "already minted"
  const spinsToMint = await db
    .select()
    .from(tokenCampaignUserSpins)
    .where(and(isNotNull(tokenCampaignUserSpins.nftCollectionId), eq(tokenCampaignUserSpins.isMinted, false)))
    .execute();

  if (spinsToMint.length === 0) {
    logger.log("No user spins to mint right now.");
    return;
  }

  // 2) Iterate over each spin and attempt to mint
  for (const spin of spinsToMint) {
    // Wrap in a transaction
    await db.transaction(async (trx) => {
      // Re-fetch spin in transaction to ensure it’s still valid
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
      if (!collection?.name || !collection?.description || !collection?.image || !collection?.address) {
        logger.error(`Collection ${collection.id} missing required fields. Cannot mint spinId=${spin.id}.`, collection);
        return;
      }
      logger.log(`Collection found for spinId=${spin.id}:`, collection);
      // 4) Retrieve the user’s wallet address from orders
      //    (assuming user has at least one order with a valid wallet_address)
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

      // 5) Prepare the NFT index:
      const nextIndex = (collection.lastRegisteredItemIndex ?? 0) + 1;
      logger.log(
        `Next index for collection ${collection.id} is ${nextIndex} for spinId=${spin.id} and userId=${freshSpin.userId}`
      );
      // 6) Create metadata JSON & upload to Minio
      //    For example, you might use the collection’s name/description/image
      //    plus spin-specific attributes:
      const collectionMetaData = {
        name: collection.name ?? "Campaign NFT",
        // date and time of the event
        description: `${new Date().toISOString()}`,
        image:
          "https://cache.tonapi.io/imgproxy/LA23SeGEFMy05wWxEscxiuLL7pqDkFwo2_t3CfGvDBA/rs:fill:500:500:1/g:no/aHR0cHM6Ly9zLmdldGdlbXMuaW8vbmZ0L2MvNjgwMTZjNGQ3NGRmNzFhYTBjOTNhZGQ0LzUvaW1hZ2UucG5n.webp",
        attributes: {
          order_id: order.uuid,
          ref: "freshSpin.spinPackageId ?? 0",
        },
        buttons: [
          {
            label: "check your onion", // or any relevant label
            uri: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=tab_campagin`,
          },
        ],
      };
      logger.log(collectionMetaData);
      const meta_data_url = await uploadJsonToMinio(
        {
          name: "Test paid event nft 7 apr 25",
          image: "https://staging-storage.toncloud.observer/onton/event/dfb24decca_1744022616087_event_image.jpeg",
          buttons: [
            {
              label: "Join The Onton Event",
              uri: "https://t.me/notnonstagebot/event?startapp=285f19ae-2249-4185-bb8a-3cb1b41d9765",
            },
          ],
          attributes: {
            order_id: "abe9b80a-a0da-43bb-a625-330d1f1b9741",
            ref: "onton",
          },
          description: "Test paid event nft 7 apr 25Test paid event nft 7 apr 25",
        },
        "ontonitem" // your desired bucket or folder in minio
      );
      if (!meta_data_url) {
        logger.error(`Failed to upload metadata for spinId=${spin.id} and userId=${freshSpin.userId}`);
        return;
      }
      logger.log(`Uploaded metadata for spinId=${spin.id} to ${meta_data_url}`);

      // 7) Mint the NFT
      //    Make sure your mintNFT function can handle these arguments:
      const nftAddressOnChain = await mintNFT(
        walletAddress, // user’s address
        collection.address, // the collection address on-chain
        nextIndex, // item index
        meta_data_url // URL to your JSON metadata
      );

      if (!nftAddressOnChain) {
        logger.error(`Mint returned null for spinId=${spin.id}. Possibly failed on-chain.`);
        // Possibly throw or just return to rollback transaction
        throw new Error(`Failed to mint NFT for spinId=${spin.id}`);
      }

      // 8) Update your database:

      // 8a) Update the collection’s lastRegisteredItemIndex
      await trx
        .update(tokenCampaignNftCollections)
        .set({ lastRegisteredItemIndex: nextIndex })
        .where(eq(tokenCampaignNftCollections.id, collection.id))
        .execute();

      // 8b) Mark the spin as minted

      await trx
        .update(tokenCampaignUserSpins)
        .set({ isMinted: true })
        .where(eq(tokenCampaignUserSpins.id, freshSpin.id))
        .execute();

      // 8c) Insert a record in token_campaign_nft_items (or your NFT items table)
      await trx
        .insert(tokenCampaignNftItems)
        .values({
          // Map to your actual columns from token_campaign_nft_items
          itemId: freshSpin.id,
          itemType: collection.campaignType, // or any type that makes sense
          nftAddress: nftAddressOnChain,
          index: nextIndex,
          collectionAddress: collection.address,
          owner: freshSpin.userId,
        })
        .execute();

      logger.log(`Minted spinId=${spin.id} => NFT ${nftAddressOnChain}`);
    });
    break;
  }
}
