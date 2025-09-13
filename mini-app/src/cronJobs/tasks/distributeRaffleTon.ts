/**
 * distributeRaffleTon.ts
 * ────────────────────────────────────────────────────────────────
 * • event wallets are **WalletContractV5 R1** (64-msg soft-limit)
 * • pays winners in ≤ CHUNK_SIZE_RAFFLE batches
 * • fee maths uses the SAME bigint **nano-TON** constants as the UI
 */

import { WalletContractV5R1, internal, SendMode } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, comment } from "@ton/core";
import { is_mainnet, v2_client } from "@/services/tonCenter";

import eventRafflesDB from "@/db/modules/eventRaffles.db";
import eventRaffleResultsDB from "@/db/modules/eventRaffleResults.db";
import eventWalletDB from "@/db/modules/eventWallets.db";
import { fetchTonBalance } from "@/lib/tonBalance";
import { deployWallet } from "@/lib/deployWallet";
import { toWords } from "@/server/utils/mnemonic";
import { logger } from "@/server/utils/logger";
import { sendTelegramWithRetryRaffle } from "@/cronJobs/helper/sendTelegramWithRetryRaffle";

/* shared fee constants (nano-TON) */
import { CHUNK_SIZE_RAFFLE, EXT_FEE_NANO, INT_FEE_NANO, SAFETY_FLOOR_NANO } from "@/constants";

/* ------------------------------------------------------------ */
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── cron entry ─────────────────────────────────────────────── */
export async function distributeRafflesTon(): Promise<void> {
  const raffles = await eventRafflesDB.listByStatus("distributing");
  for (const r of raffles) {
    try {
      logger.log(`raffle ${r.raffle_id} payout started`);
      await payOneRaffle(r.raffle_id, r.event_id);
    } catch (err) {
      logger.error(`raffle ${r.raffle_id} payout failed`, err);
    }
  }
}

/* ── worker for a single raffle ─────────────────────────────── */
async function payOneRaffle(raffleId: number, eventId: number): Promise<void> {
  const BASE_URL = is_mainnet ? "https://tonviewer.com/" : "https://testnet.tonviewer.com/";

  /* 1. winners */
  const winners = await eventRaffleResultsDB.listEligible(raffleId);
  if (!winners.length) return;

  /* 2. event wallet row */
  const row = await eventWalletDB.getWalletWithMnemonic(eventId);
  if (!row) throw new Error("event wallet not found");

  logger.log(
    `raffle ${raffleId}: winners ${winners.length}, wallet ${row.wallet_address}`,
    toWords(row.mnemonicWords).join(" ")
  );

  /* 3. deploy wallet (first run) */
  if (!(await deployWallet(row.mnemonicWords, row.wallet_address))) return;

  /* 4. budget check based on configured prize pool */
  const raffle = await eventRafflesDB.fetchRaffleByEvent(eventId);
  if (!raffle || !raffle.prize_pool_nanoton) {
    logger.warn(`raffle ${raffleId}: no configured prize pool`);
    return;
  }

  const batchCount = Math.ceil(winners.length / CHUNK_SIZE_RAFFLE);
  const balanceNano = await fetchTonBalance(row.wallet_address);
  const gasBudget = EXT_FEE_NANO * BigInt(batchCount) + INT_FEE_NANO * BigInt(winners.length);
  const required = raffle.prize_pool_nanoton + gasBudget + SAFETY_FLOOR_NANO;

  // Detailed budget log for auditing
  logger.log(
    [
      `raffle ${raffleId}: budget check`,
      `pool=${Number(raffle.prize_pool_nanoton) / 1e9} TON`,
      `winners=${winners.length}`,
      `batches=${batchCount}`,
      `gas=${Number(gasBudget) / 1e9} TON`,
      `safety=${Number(SAFETY_FLOOR_NANO) / 1e9} TON`,
      `required=${Number(required) / 1e9} TON`,
      `balance=${Number(balanceNano) / 1e9} TON`,
    ].join(" | ")
  );

  if (balanceNano < required) {
    logger.warn(
      `raffle ${raffleId}: insufficient funds – balance=${Number(balanceNano) / 1e9} TON, required=${Number(required) / 1e9} TON`
    );
    return;
  }

  /* 5. per-user share: redistribute full pool among actual winners */
  const perUserNano = raffle.prize_pool_nanoton / BigInt(winners.length);
  if (perUserNano === BigInt(0)) {
    logger.warn(`raffle ${raffleId}: pool too small per user`);
    return;
  }

  logger.log(
    `raffle ${raffleId}: per-user ≈ ${Number(perUserNano) / 1e9} TON across ${winners.length} winners`
  );

  /* 5. re-create wallet contract */
  const keyPair = await mnemonicToWalletKey(toWords(row.mnemonicWords));
  const wallet = WalletContractV5R1.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  if (!wallet.address.equals(Address.parse(row.wallet_address))) {
    throw new Error("Mnemonic ↔ stored address mismatch (V5-R1)");
  }

  const provider = v2_client().provider(wallet.address);

  logger.log(
    `raffle ${raffleId}: ${batchCount} batches – ` +
      `${winners.length} winners – ` +
      `~${Number(perUserNano) / 1e9} TON each`
  );

  /* 6. send batches */
  for (let i = 0; i < winners.length; i += CHUNK_SIZE_RAFFLE) {
    const seqno = await wallet.getSeqno(provider);

    const msgs = winners.slice(i, i + CHUNK_SIZE_RAFFLE).map((w) =>
      internal({
        to: Address.parse(w.wallet_address),
        value: perUserNano,
        bounce: false,
        body: comment(`uid:${w.user_id} raffle:${raffleId} rank:${w.rank}`),
      })
    );

    logger.log(`raffle ${raffleId}: batch ${i / CHUNK_SIZE_RAFFLE + 1}/${batchCount} – seqno ${seqno}`);

    await wallet.sendTransfer(provider, {
      seqno,
      secretKey: keyPair.secretKey as Buffer,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: msgs,
    });

    /* wait until seqno increments */
    for (let t = 0; t < 10; t++) {
      await pause(2_000);
      if ((await wallet.getSeqno(provider)) > seqno) break;
      if (t === 9) throw new Error("seqno did not advance – network lag?");
    }
  }

  /* 7. DB bookkeeping */
  await eventRaffleResultsDB.markManyPaid(
    winners.map((w) => w.id),
    perUserNano,
    "toncenter-batch"
  );
  await eventRafflesDB.completeRaffle(raffleId);

  logger.log(`raffle ${raffleId} completed ✓`);

  /* 8. Telegram notifications (best-effort) */
  for (const w of winners) {
    try {
      const msg =
        `🎉 You just received **${Number(perUserNano) / 1e9} TON** ` +
        `for ranking #${w.rank} in the raffle!\n\n` +
        `Transaction will appear shortly.`;
      await sendTelegramWithRetryRaffle({
        chat_id: w.user_id,
        message: msg,
        link: BASE_URL + w.wallet_address,
        linkText: "View on TON Viewer",
      });
      logger.log(`[tg] notified ${w.user_id}`);
    } catch (err) {
      logger.error(`[tg] FAIL ${w.user_id}`, err);
    }
    await pause(300); // respect flood-limits
  }
}
