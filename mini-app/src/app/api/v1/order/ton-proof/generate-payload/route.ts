// app/api/ton-auth/generate-payload/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { PAYLOAD_TTL, SHARED_SECRET } from "@/constants";

export async function GET() {
  try {
    // ```
    // 0             8                 16               48
    // | random bits | expiration time | sha2 signature |
    // 0                                       32
    // |             payload_hex               |
    // ```
    const randomBits = crypto.randomBytes(8);

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = Buffer.alloc(8);
    expirationTime.writeBigUint64BE(BigInt(currentTime + PAYLOAD_TTL));
    const payload = Buffer.concat([randomBits, expirationTime]);

    const hmac = crypto.createHmac("sha256", SHARED_SECRET);
    hmac.update(payload);
    const signature = hmac.digest();

    const finalPayload = Buffer.concat([payload, signature]);
    const payloadHex = finalPayload.subarray(0, 32).toString("hex");

    return NextResponse.json({ payload: payloadHex });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate payload" },
      { status: 500 }
    );
  }
}
