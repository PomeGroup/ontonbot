// jobs/createEventWallets.ts
import { db } from "@/db/db";
import { events } from "@/db/schema/events";
import { isNotNull, gt, eq, and, isNull } from "drizzle-orm";
import { mnemonicNew, mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import eventWalletDB from "@/db/modules/eventWallets.db";
import { encrypt } from "@/lib/cryptoHelpers"; // <= your encryption helper
import { logger } from "@/server/utils/logger";

/**
 * Generate TON wallets for **up-coming** events that already have an activity_id
 * but no wallet yet.  Runs sequentially so you can schedule it in a cron.
 */
export async function createWalletsForUpcomingEvents(): Promise<void> {
  const nowSec = Math.floor(Date.now() / 1000);

  /* ---------------------------------------------------------------------- */
  /*   1. FETCH CANDIDATE EVENTS                                            */
  /* ---------------------------------------------------------------------- */
  const candidates = await db
    .select({
      id: events.event_id,
      uuid: events.event_uuid,
      title: events.title,
    })
    .from(events)
    .where(
      and(
        isNotNull(events.activity_id), // activity already registered
        gt(events.end_date, nowSec), // future event
        isNull(events.wallet_address) // ← wallet_address IS NULL
      )
    )
    .execute();

  logger.log(`[wallet-creator] Found ${candidates.length} upcoming events with activity_id and no wallet.`);

  /* ---------------------------------------------------------------------- */
  /*   2. PROCESS ONE-BY-ONE                                                */
  /* ---------------------------------------------------------------------- */
  for (const ev of candidates) {
    try {
      /* ---------- skip if another worker did it in the meantime ---------- */
      const existing = await eventWalletDB.fetchEventWalletByEventId(ev.id);
      if (existing) {
        logger.log(`[wallet-creator] Wallet already exists for event ${ev.id} – skipping.`);
        continue;
      }

      /* ----------------------- create TON Wallet V4 ---------------------- */
      const mnemonic = await mnemonicNew(); // 24 words
      const keyPair = await mnemonicToWalletKey(mnemonic);
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
      });
      const address = wallet.address.toString(); // bounceable

      /* ------------------------- persist to DB --------------------------- */
      await eventWalletDB.insertEventWallet({
        event_id: ev.id,
        wallet_address: address,
        public_key: Buffer.from(keyPair.publicKey).toString("base64"),
        mnemonic: encrypt(mnemonic.join(" ")), // 🔐
      });

      // mirror address into events table for convenience
      await db.update(events).set({ wallet_address: address }).where(eq(events.event_id, ev.id)).execute();

      logger.log(`[wallet-creator] ✅ Wallet ${address} created for event ${ev.id} (${ev.title}).`);
    } catch (err) {
      logger.error(`[wallet-creator] ❌ Failed to create wallet for event ${ev.id}`, err);
    }
  }
}
