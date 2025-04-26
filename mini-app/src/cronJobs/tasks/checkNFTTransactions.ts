import { config } from "@/server/config";
import { logger } from "@/server/utils/logger";
import { db } from "@/db/db";
import { walletChecks } from "@/db/schema/walletChecks";
import { eq, inArray } from "drizzle-orm";
import tonCenter from "@/server/routers/services/tonCenter";
import { tokenCampaignNftItems } from "@/db/schema/tokenCampaignNftItems";
import { tokenCampaignNftCollections } from "@/db/schema/tokenCampaignNftCollections";
import { tokenCampaignUserSpins } from "@/db/schema/tokenCampaignUserSpins";
import { tokenCampaignMergeTransactions } from "@/db/schema/tokenCampaignMergeTransactions";
import { is_prod_env } from "@/server/utils/evnutils";

/**
 * This function checks the "minter wallet" for new transactions.
 * Each "merge" is indicated by an in_msg comment like:
 *    user=EQD...&indexes=[7,64,65]
 * We parse those indexes, check the DB, confirm gold/silver/bronze
 * all have `mergeStatus=able_to_merge`, then record a new row in
 * `token_campaign_merge_transactions`, and set them to `mergeStatus="merging"`.
 */
export async function checkMinterTransactions() {
  // 1) Minter wallet from config
  const minter_wallet_address = config?.ONTON_MINTER_WALLET;
  if (!minter_wallet_address) {
    logger.error("Minter wallet address not set in config!");
    return;
  }

  // 2) Decide the range (based on last known checked_lt)
  const three_hours_ago = Math.floor((Date.now() - 3 * 3600 * 1000) / 1000);
  const [existingRow] = await db
    .select({ checked_lt: walletChecks.checked_lt })
    .from(walletChecks)
    .where(eq(walletChecks.wallet_address, minter_wallet_address))
    .execute();

  let start_lt: bigint | null = null;
  if (existingRow?.checked_lt) {
    start_lt = existingRow.checked_lt + BigInt(1);
  }
  const start_utime = start_lt ? null : three_hours_ago;

  // 3) Fetch all new transactions from the minter wallet
  const transactions = await tonCenter.fetchAllTransactions(minter_wallet_address, start_utime, start_lt);
  if (!transactions?.length) {
    logger.info(`[MinterCheck] No new transactions for ${minter_wallet_address}`);
    return;
  }

  // 4) Parse merges from the in_msg (since out_msgs are empty)
  const mergesFound = parseMinterMergesFromInMsg(transactions);

  // 5) For each found "merge" (with 3 indexes), verify in DB
  for (const mergeEvt of mergesFound) {
    const { txHash, userWallet, indexes } = mergeEvt;
    // indexes = [7, 64, 65], for example

    // Let's fetch from DB to confirm we have 3 items with those indexes
    // ,and they have mergeStatus=able_to_merge, plus are gold/silver/bronze
    const dbRows = await db
      .select({
        nftItem: {
          itemId: tokenCampaignNftItems.itemId,
          nftAddress: tokenCampaignNftItems.nftAddress,
          index: tokenCampaignNftItems.index,
          mergeStatus: tokenCampaignNftItems.mergeStatus,
        },
        collection: {
          id: tokenCampaignNftCollections.id,
          name: tokenCampaignNftCollections.name,
        },
      })
      .from(tokenCampaignNftItems)
      .innerJoin(tokenCampaignUserSpins, eq(tokenCampaignUserSpins.id, tokenCampaignNftItems.itemId))
      .innerJoin(tokenCampaignNftCollections, eq(tokenCampaignNftCollections.id, tokenCampaignUserSpins.nftCollectionId))
      .where(inArray(tokenCampaignNftItems.index, indexes.map(Number))) // convert to number if needed
      .execute();

    // if not found exactly 3 in prod => skip
    if (dbRows.length !== 3 && is_prod_env()) {
      logger.warn(
        `[MinterCheck] TX ${txHash} claims indexes [${indexes.join(", ")}], but DB found ${dbRows.length}. Skipping.`
      );
      continue;
    }

    // We want exactly one row with collection.id=1 (gold), one with 2 (silver), one with 3 (bronze)
    // all with mergeStatus=able_to_merge
    const gold = dbRows.find((r) => r.collection.id === 1 && r.nftItem.mergeStatus === "able_to_merge");
    const silver = dbRows.find((r) => r.collection.id === 2 && r.nftItem.mergeStatus === "able_to_merge");
    const bronze = dbRows.find((r) => r.collection.id === 3 && r.nftItem.mergeStatus === "able_to_merge");

    if (!gold || !silver || !bronze) {
      logger.warn(`[MinterCheck] TX ${txHash} didn't contain gold/silver/bronze all able_to_merge. Skipping.`);
      continue;
    }

    await db.transaction(async (tx) => {
      // 1) Update NFTs to "merging"
      await tx
        .update(tokenCampaignNftItems)
        .set({ mergeStatus: "merging" })
        .where(
          inArray(tokenCampaignNftItems.nftAddress, [
            gold.nftItem.nftAddress,
            silver.nftItem.nftAddress,
            bronze.nftItem.nftAddress,
          ])
        )
        .execute();

      // 2) Insert a row in token_campaign_merge_transactions
      await tx
        .insert(tokenCampaignMergeTransactions)
        .values({
          walletAddress: userWallet,
          transactionHash: txHash,
          goldNftAddress: gold.nftItem.nftAddress,
          silverNftAddress: silver.nftItem.nftAddress,
          bronzeNftAddress: bronze.nftItem.nftAddress,
          extraData: `Merged indexes [${indexes.join(",")}] by user ${userWallet} at ${new Date().toISOString()}`,
        })
        .execute();
    });

    logger.info(
      `[MinterCheck] TX ${txHash}: merged G=${gold.nftItem.index}, S=${silver.nftItem.index}, B=${bronze.nftItem.index} (addresses: ${gold.nftItem.nftAddress}, ${silver.nftItem.nftAddress}, ${bronze.nftItem.nftAddress}). Set to "merging".`
    );
  }

  // 6) Update walletChecks last_lt
  const last_lt = BigInt(transactions[transactions.length - 1].lt);
  if (start_lt) {
    await db
      .update(walletChecks)
      .set({ checked_lt: last_lt })
      .where(eq(walletChecks.wallet_address, minter_wallet_address))
      .execute();
  } else {
    await db.insert(walletChecks).values({ wallet_address: minter_wallet_address, checked_lt: last_lt }).execute();
  }

  logger.info(`[MinterCheck] Completed checking merges for ${minter_wallet_address}`);
}

/**
 * parseMinterMergesFromInMsg:
 * Looks at each transaction's in_msg, checks if `decoded.comment`
 * has "user=XXX" and "indexes=[...,...,...]". If so, returns
 * an object with { txHash, userWallet, indexes[] } for further DB checks.
 */
function parseMinterMergesFromInMsg(transactions: any[]) {
  const merges: Array<{
    txHash: string;
    userWallet: string;
    indexes: number[];
  }> = [];

  for (const tx of transactions) {
    const inMsg = tx.in_msg;
    if (!inMsg) continue;

    // decode the comment
    const comment = inMsg?.message_content?.decoded?.comment || "";
    logger.log(`[MinterCheck] TX ${tx.hash} comment: ${comment}`);
    // Example: user=UQDIh_j4EZPSomething&indexes=[7,64,65]
    if (!comment.includes("user=") || !comment.includes("indexes=[")) {
      logger.log(`[MinterCheck] TX ${tx.hash} comment: ${comment}  doesn't have user= or indexes=[`);
      continue;
    }

    // parse the user
    const userMatch = comment.match(/user=([^&\s]+)/);
    const userWallet = userMatch ? userMatch[1] : "unknown_user";

    // parse the indexes
    const indexesMatch = comment.match(/indexes=\[([\s\S]*?)]/);
    if (!indexesMatch || !indexesMatch[1]) {
      logger.warn(`[MinterCheck] TX ${tx.hash} comment doesn't have valid indexes.`);
      continue;
    }

    const indexesStr = indexesMatch[1];
    const indexArr = indexesStr.split(",").map((s: string) => parseInt(s.trim(), 10));

    if (indexArr.length !== 3) {
      // maybe you only consider merges that have exactly 3 indexes
      logger.warn(`[MinterCheck] TX ${tx.hash} has ${indexArr.length} indexes. Skipping.`);
      continue;
    }

    merges.push({
      txHash: tx.hash,
      userWallet,
      indexes: indexArr,
    });
  }

  return merges;
}
