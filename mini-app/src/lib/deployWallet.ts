/**
 * deployWallet.ts   –  V5-R1 edition
 * ───────────────────────────────────────────────────────────────
 * • Derives the V5-R1 address from the mnemonic (same factory you used
 *   when creating the wallet).
 * • If seqno === 0 ➜ broadcasts a self-transfer (0.06 TON) to deploy.
 * • Returns:
 *       true   – wallet already active
 *       false  – deploy tx just sent; cron should retry after 1-2 blocks
 */

import {
  WalletContractV5R1, // ← NEW wallet class
  internal,
  toNano,
  SendMode,
} from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address } from "@ton/core";
import { v2_client } from "@/services/tonCenter";
import { logger } from "@/server/utils/logger";

/* 0.06 TON covers deployment + a bit of storage */
const INIT_VALUE = toNano("0.06");

/* helper: accept string or string[] */
const toWords = (src: string | string[]): string[] => (Array.isArray(src) ? src : src.trim().split(/\s+/));

export async function deployWallet(mnemonic: string | string[], storedAddress: string): Promise<boolean> {
  /* 1. derive address from mnemonic (V5-R1) */
  const words = toWords(mnemonic);
  const keyPair = await mnemonicToWalletKey(words);
  const wallet = WalletContractV5R1.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });
  const derivedAddr = wallet.address;
  const storedAddr = Address.parse(storedAddress);

  if (!derivedAddr.equals(storedAddr)) {
    logger.error(
      `Mnemonic ↔ address mismatch:
  stored  : ${storedAddr.toString({ urlSafe: true })}
  derived : ${derivedAddr.toString({ urlSafe: true })}`
    );
    return false; // cannot safely deploy
  }

  /* 2. seqno check  –  already active? */
  const client = v2_client();
  const provider = client.provider(derivedAddr);
  const seqno = await wallet.getSeqno(provider);

  if (seqno !== 0) {
    logger.log(`wallet ${derivedAddr.toString({ urlSafe: true })} already active (seqno ${seqno})`);
    return true;
  }

  /* 3. first external message (deploy) */
  logger.log(`deploying wallet ${derivedAddr.toString({ urlSafe: true })}`);

  await wallet.sendTransfer(provider, {
    seqno: 0, // first ext-msg
    secretKey: keyPair.secretKey as Buffer,
    sendMode: SendMode.PAY_GAS_SEPARATELY, // pay gas from msg value
    messages: [
      internal({
        to: derivedAddr, // self-transfer
        value: INIT_VALUE,
        bounce: false,
      }),
    ],
  });

  logger.log("deploy tx sent – wait one block then retry");
  return false; // will be active next cron run
}
