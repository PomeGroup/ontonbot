import { config } from "@/server/config";
import { logger } from "@/server/utils/logger";
import { db } from "@/db/db";
import { walletChecks } from "@/db/schema/walletChecks";
import { and, eq, or } from "drizzle-orm";
import tonCenter from "@/server/routers/services/tonCenter";
import { orders } from "@/db/schema/orders";
import { tokenCampaignOrders, TokenCampaignOrdersStatus } from "@/db/schema";

export const CheckTransactions = async () => {
  // Get Orders to be Checked (Sort By Order.TicketDetails.Id)
  // Get Order.TicketDetails Wallet
  // Get Transactions From Past 30 Minutes
  // Update (DB) Paid Ones as paid others as failed
  // logger.log("@@@@ CheckTransactions  @@@@");

  const wallet_address = config?.ONTON_WALLET_ADDRESS;
  const campaign_wallet_address = config?.ONTON_WALLET_ADDRESS_CAMPAIGN;

  if (!wallet_address || !campaign_wallet_address) {
    logger.error("ONTON_WALLET_ADDRESS NOT SET");
    return;
  }
  const hour_ago = Math.floor((Date.now() - 3600 * 1000) / 1000);
  const wallet_checks_details = await db
    .select({ checked_lt: walletChecks.checked_lt })
    .from(walletChecks)
    .where(eq(walletChecks.wallet_address, wallet_address || ""))
    .execute();

  let start_lt = null;
  if (wallet_checks_details && wallet_checks_details.length) {
    if (wallet_checks_details[0]?.checked_lt) {
      start_lt = wallet_checks_details[0].checked_lt + BigInt(1);
    }
  }

  const start_utime = start_lt ? null : hour_ago;

  const transactions = await tonCenter.fetchAllTransactions(wallet_address, start_utime, start_lt);

  const parsed_orders = await tonCenter.parseTransactions(transactions, "onton_order=");

  for (const o of parsed_orders) {
    if (o.verfied) {
      logger.log("cron_trx_", o.order_uuid, o.order_type, o.value);
      await db
        .update(orders)
        .set({ state: "processing", owner_address: o.owner.toString(), trx_hash: o.trx_hash, created_at: new Date() })
        .where(
          and(
            eq(orders.uuid, o.order_uuid),
            or(eq(orders.state, "new"), eq(orders.state, "confirming")),
            eq(orders.total_price, o.value),
            eq(orders.payment_type, o.order_type)
          )
        );
    }
  }
  const campaign_wallet_checks_details = await db
    .select({ checked_lt: walletChecks.checked_lt })
    .from(walletChecks)
    .where(eq(walletChecks.wallet_address, campaign_wallet_address || ""))
    .execute();
  let campaign_start_lt = null;
  if (campaign_wallet_checks_details && campaign_wallet_checks_details.length) {
    if (campaign_wallet_checks_details[0]?.checked_lt) {
      campaign_start_lt = campaign_wallet_checks_details[0].checked_lt + BigInt(1);
    }
  }

  const campaign_start_utime = campaign_start_lt ? null : hour_ago;

  const campaign_transactions = await tonCenter.fetchAllTransactions(
    campaign_wallet_address,
    campaign_start_utime,
    campaign_start_lt
  );

  const parsed_campaign_orders = await tonCenter.parseTransactions(campaign_transactions, "OnionCampaign=");

  for (const co of parsed_campaign_orders) {
    logger.log("cron_trx_campaign_heartBeat", co.order_uuid, co.order_type, co.value);
    if (co.verfied) {
      if (co.order_uuid.length !== 36) {
        logger.error("cron_trx_campaign_ Invalid Order UUID", co.order_uuid);
        continue;
      }
      logger.log("cron_trx_campaign_", co.order_uuid, co.order_type, co.value);
      // Update your 'token_campaign_orders' table:
      await db
        .update(tokenCampaignOrders)
        .set({
          status: "processing" as TokenCampaignOrdersStatus, // or "completed", etc.
          trxHash: co.trx_hash,
          // If you store an owner_address or something similar:
          wallet_address: co.owner.toString(),
        })
        .where(
          and(
            eq(tokenCampaignOrders.uuid, co.order_uuid),
            or(eq(tokenCampaignOrders.status, "new"), eq(tokenCampaignOrders.status, "confirming")),
            // If you want to verify the price matches `co.value`:
            eq(tokenCampaignOrders.finalPrice, co.value.toString())
          )
        )
        .execute();
    }
  }
  //-- Finished Checking
  if (transactions && transactions.length) {
    const last_lt = BigInt(transactions[transactions.length - 1].lt);
    if (start_lt) {
      await db
        .update(walletChecks)
        .set({ checked_lt: last_lt })
        .where(eq(walletChecks.wallet_address, wallet_address))
        .execute();
    } else {
      await db.insert(walletChecks).values({ wallet_address: wallet_address, checked_lt: last_lt }).execute();
    }
  }
  if (campaign_transactions && campaign_transactions.length) {
    const last_lt = BigInt(campaign_transactions[campaign_transactions.length - 1].lt);
    if (campaign_start_lt) {
      await db
        .update(walletChecks)
        .set({ checked_lt: last_lt })
        .where(eq(walletChecks.wallet_address, campaign_wallet_address))
        .execute();
    } else {
      await db.insert(walletChecks).values({ wallet_address: campaign_wallet_address, checked_lt: last_lt }).execute();
    }
  }
};
