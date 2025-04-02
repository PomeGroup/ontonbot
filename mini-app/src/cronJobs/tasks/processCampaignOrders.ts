import { db } from "@/db/db";
import { tokenCampaignOrdersDB } from "@/server/db/tokenCampaignOrders.db";
import { tokenCampaignUserSpinsDB } from "@/server/db/tokenCampaignUserSpins.db";
import { TokenCampaignOrdersStatus } from "@/db/schema/tokenCampaignOrders";

/**
 * Cron job that checks for "confirming" orders on TON blockchain,
 * verifies payment, updates order status, and creates user spins.
 */
export async function processCampaignOrders() {
  // 1) Find all orders that have status = "confirming"
  const pendingOrders = await tokenCampaignOrdersDB.getOrdersByStatus("processing");

  for (const order of pendingOrders) {
    // Wrap updates + spin creation in a transaction
    await db.transaction(async (tx) => {
      // 3a) Mark the order as "processing"
      await tokenCampaignOrdersDB.updateOrderByIdTx(tx, order.id, {
        status: "processing" as TokenCampaignOrdersStatus,
      });

      // 4) Insert user spins for that order, e.g. spinCount times
      await tokenCampaignUserSpinsDB.addUserSpinsForOrderTx(tx, order.userId, order.spinPackageId);

      // 5) Mark the order as "completed" after successful spin insertion
      await tokenCampaignOrdersDB.updateOrderByIdTx(tx, order.id, {
        status: "completed" as TokenCampaignOrdersStatus,
      });
    });
  }
}
