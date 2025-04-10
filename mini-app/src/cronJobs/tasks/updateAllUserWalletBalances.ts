import { db } from "@/db/db";
import { tokenCampaignOrders } from "@/db/schema";
import { userWalletBalances } from "@/db/schema/userWalletBalances";
import { getAccountBalance } from "@/server/routers/services/tonCenter";
import { eq, sql } from "drizzle-orm";

/**
 * Example function to update wallet balances for all user-wallet pairs found in token_campaign_orders.
 * You can call this from your cron job.
 */
export async function updateAllUserWalletBalances() {
  // 1) Get distinct user_id + wallet_address from orders
  //    (filter out rows where wallet_address is null or empty if desired)
  const rows = await db
    .select({
      userId: tokenCampaignOrders.userId,
      walletAddress: tokenCampaignOrders.wallet_address,
    })
    .from(tokenCampaignOrders)
    // If you only care about completed orders:
    // .where(eq(tokenCampaignOrders.state, "completed"))
    // Example to exclude null addresses:
    // .where(sql`${tokenCampaignOrders.walletAddress} IS NOT NULL`)
    .groupBy(tokenCampaignOrders.userId, tokenCampaignOrders.wallet_address);

  // 2) For each row, fetch the on-chain balance via tonCenter
  for (const row of rows) {
    const { userId, walletAddress } = row;
    if (!walletAddress) continue; // skip if no address

    try {
      // getAccountBalance() fetches from tonCenter /accountStates endpoint
      const balance = await getAccountBalance(walletAddress);

      // 3) Upsert into user_wallet_balances
      //    (requires a unique key on (userId, walletAddress) or a composite PK)
      await db
        .insert(userWalletBalances)
        .values({
          userId,
          walletAddress,
          lastBalance: balance.toString(),
          placeOfConnection: "campaign", // or whatever is appropriate
          // createdAt automatically has a default, or set explicitly if needed
        })
        .onConflictDoUpdate({
          target: [userWalletBalances.userId, userWalletBalances.walletAddress, userWalletBalances.placeOfConnection],
          set: {
            lastBalance: balance.toString(),
            createdAt: sql`NOW
                ()`, // or use new Date() if your column is timestamptz
          },
        });
    } catch (error) {
      // Handle or log any errors (e.g., network issues, invalid addresses, etc.)
      console.error(`Failed to update balance for wallet ${walletAddress}`, error);
    }
  }

  console.log("All user wallet balances updated successfully.");
}
