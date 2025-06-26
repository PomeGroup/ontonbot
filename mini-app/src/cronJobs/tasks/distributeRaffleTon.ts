/* ------------------------------------------------------------------ */
/*  distributeRaffleTon.ts                                            */
/*  Runs in a cron/queue, finds raffles in “distributing” state and   */
/*  pays every eligible user in a single TON batch.                   */
/* ------------------------------------------------------------------ */
import "dotenv/config";
import { TonClient, WalletContractV4, internal, toNano, SendMode } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address } from "@ton/core";

import eventRafflesDB from "@/db/modules/eventRaffles.db";
import eventRaffleResultsDB from "@/db/modules/eventRaffleResults.db";
import eventWalletDB from "@/db/modules/eventWallets.db";
import { fetchTonBalance } from "@/lib/tonBalance";
import { logger } from "@/server/utils/logger";

/* ---------------- fee / safety constants ------------------------- */
const BASE_FEE = toNano("0.05"); // external-msg fee reserve
const PER_USER_FEE = toNano("0.02"); // internal-msg fee reserve
const SAFETY_FLOOR = toNano("0.1"); // leave some dust in wallet

/* ---------------- public entry (cron job) ------------------------ */
export async function distributeRafflesTon() {
  const raffles = await eventRafflesDB.listByStatus("distributing");
  if (!raffles.length) return;

  for (const r of raffles) {
    try {
      await payOneRaffle(r.raffle_id, r.event_id);
    } catch (err) {
      logger.error(`raffle ${r.raffle_id} payout failed`, err);
    }
  }
}

/* ---------------- pay a single raffle ---------------------------- */
async function payOneRaffle(raffleId: number, eventId: number) {
  /* 1. winners & wallet ------------------------------------------ */
  const winners = await eventRaffleResultsDB.listEligible(raffleId);
  if (!winners.length) throw new Error("no eligible winners");

  const walletRow = await eventWalletDB.getWalletWithMnemonic(eventId);
  if (!walletRow) throw new Error("wallet missing");

  const balanceNano = await fetchTonBalance(walletRow.wallet_address);

  /* 2. compute fees & per-user share ----------------------------- */
  const totalFee = BASE_FEE + PER_USER_FEE * BigInt(winners.length);
  const distributable = balanceNano - totalFee - SAFETY_FLOOR;
  if (distributable <= BigInt(0)) throw new Error("insufficient balance");

  const perUser = distributable / BigInt(winners.length);
  if (perUser === BigInt(0)) throw new Error("share rounds to zero");

  /* 3. craft TON batch ----------------------------------------------- */
  const keyPair = await mnemonicToWalletKey(walletRow.mnemonicWords);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });

  const ton = new TonClient({
    endpoint: process.env.TONCENTER_RPC!,
    apiKey: process.env.TONCENTER_KEY!,
  });
  const provider = ton.provider(wallet.address);

  const payouts = winners.map((w) =>
    internal({
      to: Address.parse(w.wallet_address),
      value: perUser,
      bounce: false,
    })
  );

  /* 4. send — give params directly to sendTransfer ------------------- */
  const seqno = await wallet.getSeqno(provider);

  await wallet.sendTransfer(provider, {
    seqno,
    secretKey: keyPair.secretKey,
    messages: payouts,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
  });

  /* 5. mark DB & finish ---------------------------------------------- */
  await eventRaffleResultsDB.markManyPaid(
    winners.map((x) => x.id),
    perUser,
    "batch-tx-hash-placeholder"
  );
  await eventRafflesDB.completeRaffle(raffleId);
  logger.log(`raffle ${raffleId} completed`);
}
