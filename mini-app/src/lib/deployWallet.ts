/**
 * deployWallet.ts — V5-R1
 * ───────────────────────────────────────────────────────────────
 * • Re-creates the V5-R1 wallet from the mnemonic.
 * • If `seqno === 0` → sends a self-transfer for `DEPLOY_FEE_NANO`
 *   (≈ 0 .06 TON) to initialise the contract.
 * • Returns
 *     true   – wallet is already deployed
 *     false  – deploy tx just broadcast; try again after 1-2 blocks
 */
import { WalletContractV5R1, internal, SendMode } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address } from "@ton/core";
import { v2_client } from "@/services/tonCenter";
import { logger } from "@/server/utils/logger";
import { DEPLOY_FEE_NANO } from "@/constants"; // bigint nano-TON (60_000_000n)

/* helper – accept either a string or an array of words */
const toWords = (src: string | string[]) => (Array.isArray(src) ? src : src.trim().split(/\s+/));

export async function deployWallet(mnemonic: string | string[], storedAddress: string): Promise<boolean> {
  /* 1️⃣  derive wallet from mnemonic */
  const keyPair = await mnemonicToWalletKey(toWords(mnemonic));
  const wallet = WalletContractV5R1.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const derived = wallet.address;
  const stored = Address.parse(storedAddress);

  if (!derived.equals(stored)) {
    logger.error(
      `Mnemonic ↔ address mismatch:
  stored : ${stored.toString({ urlSafe: true })}
  derived: ${derived.toString({ urlSafe: true })}`
    );
    return false;
  }

  /* 2️⃣  is it already active? */
  const provider = v2_client().provider(derived);
  const seqno = await wallet.getSeqno(provider);

  if (seqno !== 0) {
    logger.log(`wallet ${derived.toString({ urlSafe: true })} active (seqno ${seqno})`);
    return true;
  }

  /* 3️⃣  deploy with a self-transfer */
  logger.log(`deploying wallet ${derived.toString({ urlSafe: true })}`);

  await wallet.sendTransfer(provider, {
    seqno: 0,
    secretKey: keyPair.secretKey as Buffer,
    sendMode: SendMode.PAY_GAS_SEPARATELY, // gas taken from message value
    messages: [
      internal({
        to: derived, // self-transfer
        value: DEPLOY_FEE_NANO, // 60 000 000 nano-TON ≈ 0 .06 TON
        bounce: false,
      }),
    ],
  });

  logger.log("deploy tx broadcast → retry after the next block");
  return false;
}
