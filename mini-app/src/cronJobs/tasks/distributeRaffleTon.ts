/**
 * distributeRaffleTon.ts
 * ────────────────────────────────────────────────────────────────
 * ▸ all event wallets are WalletContractV5R1 (64-msg soft limit)
 * ▸ pays winners in ≤ 32-msg chunks (safe on main- & test-net)
 * ▸ polls seqno after every chunk to avoid racing the network
 */

import {
  WalletContractV5R1, // ← V5-R1 wallet factory
  internal,
  toNano,
  SendMode,
} from "@ton/ton";
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

/* ── constants ────────────────────────────────────────────────── */
const CHUNK_SIZE = 254; // keep well below 64-msg hard-cap
const EXT_FEE = toNano("0.05"); // gas for each external
const INT_FEE = toNano("0.02"); // gas per internal
const SAFETY_FLOOR = toNano("0.01"); // leave a little dust
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── cron entry ───────────────────────────────────────────────── */
export async function distributeRafflesTon(): Promise<void> {
  const raffles = await eventRafflesDB.listByStatus("distributing");
  for (const r of raffles) {
    try {
      logger.log(`raffle ${r.raffle_id} payout started`);
      await payOneRaffle(r.raffle_id, r.event_id);
    } catch (e) {
      logger.error(`raffle ${r.raffle_id} payout failed`, e);
    }
  }
}

/* ── worker ───────────────────────────────────────────────────── */
async function payOneRaffle(raffleId: number, eventId: number): Promise<void> {
  const BASE_URL = is_mainnet ? "https://tonviewer.com/" : "https://testnet.tonviewer.com/";
  /* 1. winners --------------------------------------------------- */
  const winners = await eventRaffleResultsDB.listEligible(raffleId);
  if (!winners.length) return;

  /* 2. wallet row + (auto-)deploy ------------------------------- */
  const row = await eventWalletDB.getWalletWithMnemonic(eventId);
  if (!row) throw new Error("event wallet not found");
  // print row.mnemonicWords;  separated by spaces
  logger.log(
    `raffle ${raffleId}: winners ${winners.length}, wallet ${row.wallet_address}`,
    toWords(row.mnemonicWords).join(" ")
  );
  if (!(await deployWallet(row.mnemonicWords, row.wallet_address))) {
    // deploy tx just broadcast – come back next cron tick
    return;
  }

  /* 3. fee & per-user budget ------------------------------------ */
  const chunkCount = Math.ceil(winners.length / CHUNK_SIZE);
  const balance = await fetchTonBalance(row.wallet_address);
  const gasBudget = EXT_FEE * BigInt(chunkCount) + INT_FEE * BigInt(winners.length);
  const prizePool = balance - gasBudget - SAFETY_FLOOR;

  if (prizePool <= BigInt(0)) {
    logger.warn(`raffle ${raffleId}: wallet needs top-up (balance=${balance})`);
    return;
  }

  const perUser = prizePool / BigInt(winners.length);
  if (perUser === BigInt(0)) {
    logger.warn(`raffle ${raffleId}: pool too small per user`);
    return;
  }

  /* 4. reconstruct V5 wallet ------------------------------------ */
  const kp = await mnemonicToWalletKey(toWords(row.mnemonicWords));
  const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: kp.publicKey });
  const addr = wallet.address;

  if (!addr.equals(Address.parse(row.wallet_address))) {
    throw new Error("Mnemonic ↔ stored address mismatch (V5-R1)");
  }

  const client = v2_client();
  const provider = client.provider(addr);

  logger.log(`raffle ${raffleId}: chunks ${chunkCount}, winners ${winners.length}, perUser ${perUser} nano`);

  /* 5. chunked payouts ------------------------------------------ */
  for (let i = 0; i < winners.length; i += CHUNK_SIZE) {
    const seqno = await wallet.getSeqno(provider);

    const msgs = winners.slice(i, i + CHUNK_SIZE).map((w) =>
      internal({
        to: Address.parse(w.wallet_address),
        value: perUser,
        bounce: false,
        body: comment(`uid:${w.user_id} raffle:${raffleId} rank:${w.rank}`),
      })
    );

    logger.log(`raffle ${raffleId}: chunk ${i / CHUNK_SIZE + 1}/${chunkCount} → seqno ${seqno}`);

    await wallet.sendTransfer(provider, {
      seqno,
      secretKey: kp.secretKey as Buffer,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: msgs,
    });

    /* wait until seqno increments (≤20 s) */
    for (let t = 0; t < 10; t++) {
      await pause(2000);
      if ((await wallet.getSeqno(provider)) > seqno) break;
      if (t === 9) throw new Error("seqno did not advance – network lag?");
    }
  }

  /* 6. DB bookkeeping ------------------------------------------- */
  await eventRaffleResultsDB.markManyPaid(
    winners.map((w) => w.id),
    perUser,
    "toncenter-batch"
  );
  await eventRafflesDB.completeRaffle(raffleId);

  logger.log(`raffle ${raffleId} completed ✓`);
  /* 7. Notify each winner on Telegram --------------------------- */ // NEW
  for (const w of winners) {
    try {
      const msg =
        `🎉 You just received **${Number(perUser) / 1e9} TON** ` +
        `for ranking #${w.rank} in the raffle!\n\n` +
        `Tx hash will appear in your wallet shortly.`;
      await sendTelegramWithRetryRaffle({
        chat_id: w.user_id, // assuming Telegram chat_id === user_id
        message: msg,
        link: BASE_URL + w.wallet_address,
        linkText: "View transaction",
      });
      logger.log(`[tg-notify] sent to user ${w.user_id}`);
    } catch (err) {
      logger.error(`[tg-notify] FAILED for user ${w.user_id}`, err);
    }

    await pause(300); // tiny pause so you don’t hit flood-limits
  }
}
