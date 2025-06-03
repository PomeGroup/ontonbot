import { z } from "zod";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { initDataProtectedProcedure, router } from "@/server/trpc";
// ^ adapt to your local naming
import { Address } from "@ton/core";

import { redisTools } from "@/lib/redisTools";

// ^ placeholder, you must implement your own Redis or remove

/**
 * Minimal shape of the proof from the TonConnect wallet
 * (Matches your `TonProofItem` in the question)
 */
type TonProofItem = {
  address: string;
  timestamp: number;
  payload: string;
  signature: string;
};

//
// Simplified verify function (like your `verifyTonProof`)
//
function verifyTonProof(raw: string, expectedWallet: string, expectedUserId: number, ttlSeconds = 60) {
  if (!raw) throw new Error("Missing tonProof");

  let proof: TonProofItem;
  try {
    proof = JSON.parse(raw);
  } catch {
    throw new Error("Invalid tonProof JSON");
  }

  // 1) Compare addresses
  const normExpected = Address.parse(expectedWallet).toString({ bounceable: false });
  const normGot = Address.parse(proof.address).toString({ bounceable: false });
  if (normExpected !== normGot) {
    throw new Error("tonProof: wallet mismatch");
  }

  // 2) Check payload prefix — e.g. "onton-claim:<userId>:<challenge>:<timestamp>"
  const mustPrefix = `onton-claim:${expectedUserId}:`;
  if (!proof.payload.startsWith(mustPrefix)) {
    throw new Error("tonProof: payload mismatch");
  }

  // 3) Freshness check
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - proof.timestamp) > ttlSeconds) {
    throw new Error("tonProof: proof too old");
  }

  // 4) Signature-level check is omitted in your example
  //    Ideally you’d do an ed25519 verify using the wallet’s public key
}

export const tonProofRouter = router({
  /**
   *  1) Generate a unique payload for TON Proof
   *     The front-end calls this before opening wallet modal
   */
  generatePayload: initDataProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.user_id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // 1️⃣ Generate a random “challenge”
    const challenge = crypto.randomUUID();
    // 2️⃣ Optionally store in Redis (with 60s TTL) so we can confirm later
    await redisTools.setCache(`tp:${challenge}`, String(userId), 60);

    // 3️⃣ Include a timestamp, so we can do a time-based freshness check
    const timestamp = Math.floor(Date.now() / 1000);

    // 4️⃣ The wallet will sign this string
    //     Format:   "onton-claim:<userId>:<challenge>:<timestamp>"
    const payload = `onton-claim:${userId}:${challenge}:${timestamp}`;

    return { payload };
  }),

  /**
   * 2) Verify the proof returned by the wallet
   *    Return a JWT or session token if valid
   */
  verifyProof: initDataProtectedProcedure
    .input(
      z.object({
        address: z.string(), // wallet addr (bounceable uf)
        network: z.enum(["-239", "-3"]), // main- / test-net
        public_key: z.string(), // extracted by TC
        proof: z.object({
          timestamp: z.number(),
          domain: z.object({
            lengthBytes: z.number(),
            value: z.string(),
          }),
          payload: z.string(),
          signature: z.string(),
          state_init: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.user_id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      /* 1️⃣  stringify and do the minimal checks */
      const rawProof = JSON.stringify(input.proof);
      verifyTonProof(rawProof, input.address, userId);

      /* 2️⃣  (later) cryptographically validate signature, create real JWT … */
      const token = `FAKE-JWT-${Math.random().toString(36).slice(2)}`;

      return { token };
    }),
});
