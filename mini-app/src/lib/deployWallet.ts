/**
 * deployWallet.ts — V5-R1 manual deploy
 *
 * • Derives the wallet from the mnemonic and verifies it matches the
 *   stored address.
 * • If the wallet already has seqno > 0 → returns true.
 * • Otherwise it:
 *     1.  Uses wallet.createTransfer(...) to build the **signed** body
 *         for seqno 0 (empty action list, mode 3).
 *     2.  Wraps that body together with wallet.init.{code,data} into a
 *         raw external message.
 *     3.  Pushes the BOC via provider.external(...).
 * • Returns false after the broadcast so the caller can poll getSeqno()
 *   until it becomes 1.
 */

import { WalletContractV5R1, SendMode } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, beginCell } from "@ton/core";
import { v2_client } from "@/services/tonCenter";
import { logger } from "@/server/utils/logger";
import { DEPLOY_FEE_NANO } from "@/constants"; // ≈ 0.06 TON

const toWords = (src: string | string[]) => (Array.isArray(src) ? src : src.trim().split(/\s+/));

export async function deployWallet(mnemonic: string | string[], storedAddress: string): Promise<boolean> {
  /* 1️⃣  derive & sanity-check address */
  const keyPair = await mnemonicToWalletKey(toWords(mnemonic));
  const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });

  const derived = wallet.address;
  const stored = Address.parse(storedAddress);
  if (!derived.equals(stored)) {
    logger.error("Mnemonic ↔ address mismatch");
    return false;
  }

  const provider = v2_client().provider(derived);

  /* 2️⃣  active already? */
  const seqno = await wallet.getSeqno(provider);
  if (seqno !== 0) {
    logger.log(`wallet ${derived} active (seqno ${seqno})`);
    return true;
  }

  /* 3️⃣  funded enough? (needs ≥ deploy gas) */
  const { balance } = await provider.getState();
  if (balance < DEPLOY_FEE_NANO) {
    logger.warn(`wallet balance ${Number(balance) / 1e9} TON < deploy gas (~0.06 TON)`);
    return false;
  }

  /* 4️⃣  let the SDK build the **signed** body for seqno 0 */
  const validUntil = Math.floor(Date.now() / 1e3) + 60; // 60-s TTL
  const body = await wallet.createTransfer({
    authType: "external", // required for seqno 0
    secretKey: keyPair.secretKey as Buffer, // SDK signs internally
    seqno: 0,
    timeout: validUntil,
    sendMode: SendMode.PAY_GAS_SEPARATELY, // mode 3
    messages: [], // no internal msgs
  }); // <- returns Cell

  /* 5️⃣  build StateInit (code + data refs) */
  const stateInit = beginCell()
    .storeBit(0)
    .storeBit(0) // no split_depth, no special
    .storeBit(1)
    .storeRef(wallet.init.code) // code
    .storeBit(1)
    .storeRef(wallet.init.data) // data
    .storeBit(0) // no library
    .endCell();

  /* 6️⃣  assemble raw external message */
  const external = beginCell()
    .storeUint(0b10, 2) // incoming external
    .storeUint(0, 2) // src = addr_none
    .storeAddress(derived) // destination
    .storeCoins(0) // import fee
    .storeBit(1)
    .storeBit(1)
    .storeRef(stateInit) // attach StateInit
    .storeBit(1)
    .storeRef(body) // attach signed body
    .endCell();

  /* 7️⃣  broadcast */
  logger.log(`deploying wallet ${derived} via raw external BOC`);
  await provider.external(external); // throws on RPC error

  logger.log("deploy tx broadcast – poll getSeqno() until it becomes 1");
  return false;
}
