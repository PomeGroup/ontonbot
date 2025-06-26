import { Address } from "@ton/core";
import tonCenter from "@/services/tonCenter";
import ms from "ms";

/* ------------------------------------------------------------------ */
/*    In-memory cache (simple Map; swap for Redis if you like)        */
/* ------------------------------------------------------------------ */
const TTL = ms("20s"); // change to taste
const cache = new Map<string, { bal: bigint; exp: number }>();

/* ------------------------------------------------------------------ */
/*                Public helper – returns nano-TON (bigint)           */
/* ------------------------------------------------------------------ */
export async function fetchTonBalance(address: string): Promise<bigint> {
  /* 1. Validate – throws if malformed */
  Address.parse(address);

  /* 2. Cache hit? */
  const hit = cache.get(address);
  if (hit && hit.exp > Date.now()) return hit.bal;

  /* 3. Call your library (returns TON as number) */
  const tonFloat = await tonCenter.getAccountBalance(address); // e.g. 3.14159 TON
  const nano = BigInt(Math.round(tonFloat * 1e9)); // 3141590000n

  /* 4. Store & return */
  cache.set(address, { bal: nano, exp: Date.now() + TTL });
  return nano;
}
