/* ─────────────  cron/MintNFTForPaidOrders.ts  ───────────── */
import { db } from "@/db/db";
import { orders, eventRegistrants, eventPayment, nftItems } from "@/db/schema";
import { and, eq, isNotNull, asc, sql, inArray } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { Address } from "@ton/core";
import { uploadJsonToMinio } from "@/lib/minioTools";
import { mintNFT } from "@/lib/nft";
import { is_mainnet } from "@/services/tonCenter";
import { selectUserById } from "@/db/modules/users.db";
import { sendLogNotification } from "@/lib/tgBot";
import { affiliateLinksDB } from "@/db/modules/affiliateLinks.db";
import { couponItemsDB } from "@/db/modules/couponItems.db";

/**
 * Run every minute (or whatever you schedule) in a single worker.
 */
export const MintNFTForPaidOrders = async (pushLockTtl: () => unknown) => {
  /* 1️⃣  pull the next batch of “processing” orders */
  const pendingOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.state, "processing"), isNotNull(orders.event_uuid), eq(orders.order_type, "nft_mint")))
    .orderBy(asc(orders.created_at))
    .limit(50) /* keep it small to avoid time-outs */
    .execute();

  for (const ord of pendingOrders) {
    try {
      if (pushLockTtl) {
        await pushLockTtl(); // keep the job’s lock fresh
      }

      /* ── basic sanity ───────────────────────────────────── */
      const buyerAddress = ord.owner_address;
      if (!buyerAddress) {
        logger.error("order %s has no owner_address", ord.uuid);
        continue;
      }
      try {
        Address.parse(buyerAddress);
      } catch {
        logger.error("order %s owner_address unparsable: %s", ord.uuid, buyerAddress);
        continue;
      }

      /* 2️⃣  fetch all registrants that belong to this order */
      const regs = await db.select().from(eventRegistrants).where(eq(eventRegistrants.order_uuid, ord.uuid)).execute();

      if (!regs.length) {
        logger.error("order %s has ZERO registrants", ord.uuid);
        /* optional: fail the order here */
        continue;
      }

      /* 3️⃣  collect every unique event_payment_id we’ll need */
      const paymentIds = [...new Set(regs.map((r) => r.event_payment_id).filter(Boolean))] as number[];

      const paymentRows = paymentIds.length
        ? await db.select().from(eventPayment).where(inArray(eventPayment.id, paymentIds)).execute()
        : [];

      /* quick lookup */
      const paymentMap = Object.fromEntries(paymentRows.map((p) => [p.id, p]));

      /* 4️⃣  mint (or skip) per registrant */
      let mintedAll = true;

      for (const reg of regs) {
        const pay = paymentMap[reg.event_payment_id ?? -1];
        if (!pay) {
          logger.error("registrant %s missing event_payment row", reg.id);
          mintedAll = false;
          continue;
        }
        if (pay.ticket_type !== "NFT") {
          /* skip TSCSBT etc. */
          logger.log("registrant %s ticket_type %s → skip mint", reg.id, pay.ticket_type);
          continue;
        }
        if (!pay.collectionAddress) {
          logger.error("registrant %s: no collectionAddress", reg.id);
          mintedAll = false;
          continue;
        }
        /* ── guard #1: DB lookup to avoid duplicate work ── */
        const already = await db
          .select()
          .from(nftItems)
          .where(and(eq(nftItems.order_uuid, ord.uuid), eq(nftItems.registrant_id, reg.id)))
          .limit(1)
          .execute();

        if (already.length) {
          logger.log("order %s – registrant %s already minted (%s)", ord.uuid, reg.id, already[0].nft_address);
          continue; // jump to next registrant
        }
        /* build NFT metadata ------------------------------------------------- */
        const metaUrl = await uploadJsonToMinio(
          {
            name: pay.title,
            description: pay.description,
            image: pay.ticketImage,
            attributes: { order_id: ord.uuid, registrant_id: reg.id },
            buttons: [
              {
                label: "Open in Onton",
                uri: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${ord.event_uuid}`,
              },
            ],
          },
          "ontonitem"
        );

        /* figure out next index inside the collection */
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(nftItems)
          .where(eq(nftItems.event_uuid, ord.event_uuid!))
          .execute();
        const nftIdx = count;

        /* mint -------------------------------------------------------------- */
        const nftAddr = await mintNFT(
          reg.mint_wallet_address ?? buyerAddress, // mint **to guest wallet** or fallback
          pay.collectionAddress,
          nftIdx,
          metaUrl
        );

        if (!nftAddr) {
          logger.error("mint failed for registrant %s (order %s)", reg.id, ord.uuid);
          mintedAll = false;
          continue;
        }

        /* record in DB ------------------------------------------------------- */
        await db.transaction(async (trx) => {
          await trx
            .insert(nftItems)
            .values({
              event_uuid: ord.event_uuid!,
              order_uuid: ord.uuid,
              nft_address: nftAddr,
              owner: reg.user_id,
              registrant_id: reg.id,
            })
            .onConflictDoNothing();

          await trx
            .update(eventRegistrants)
            .set({ status: "approved", minted_token_address: nftAddr })
            .where(eq(eventRegistrants.id, reg.id));

          logger.log("minted NFT %s for registrant %s", nftAddr, reg.id);
        });

        /* TG log ------------------------------------------------------------- */
        try {
          const prefix = is_mainnet ? "" : "testnet.";
          const user = reg.user_id ? await selectUserById(reg.user_id) : null;
          const username = user?.username ?? "guest";

          await sendLogNotification({
            topic: "ticket",
            message: `NFT #${nftIdx + 1}
<b>${pay.title}</b>
👤 @${username} (id: <code>${reg.user_id}</code>)
<a href='https://${prefix}getgems.io/collection/${pay.collectionAddress}'>🎨 Collection</a>
<a href='https://${prefix}tonviewer.com/${nftAddr}'>📦 NFT</a>`,
          });
        } catch (err) {
          logger.error("TG-log error: %O", err);
        }
      } // end-for registrants

      /* 5️⃣  finalise order if everything minted / skipped OK */
      if (mintedAll) {
        await db.transaction(async (trx) => {
          await trx.update(orders).set({ state: "completed" }).where(eq(orders.uuid, ord.uuid));

          /* coupon / affiliate housekeeping -------------------- */
          if (ord.coupon_id) await couponItemsDB.makeCouponItemUsedTrx(trx, ord.coupon_id, ord.event_uuid!);
          if (ord.utm_source) await affiliateLinksDB.incrementAffiliatePurchase(ord.utm_source);
        });

        logger.log("order %s COMPLETED ✅", ord.uuid);
      } else {
        logger.log("order %s left in processing (some NFTs failed)", ord.uuid);
      }
    } catch (err) {
      logger.error("Mint loop error for order %s: %O", ord.uuid, err);
    }
  }
};
