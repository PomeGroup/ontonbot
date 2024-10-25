// app/api/ton-auth/generate-payload/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { SHARED_SECRET } from "@/constants"
// Ensure you have these constants properly set up in a constants file or environment variables
const PAYLOAD_TTL = parseInt(process.env.PAYLOAD_TTL || "300", 10); // Time-to-live in seconds

export async function GET() {
  try {
    // Generate random bits
    const randomBits = crypto.randomBytes(8);

    // Get current time and calculate expiration time
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = Buffer.alloc(8);
    expirationTime.writeBigUint64BE(BigInt(currentTime + PAYLOAD_TTL));
    const payload = Buffer.concat([randomBits, expirationTime]);

    // Generate signature using HMAC
    const hmac = crypto.createHmac("sha256", SHARED_SECRET);
    hmac.update(payload);
    const signature = hmac.digest();

    // Create the final payload and convert it to hex
    const finalPayload = Buffer.concat([payload, signature]);
    const payloadHex = finalPayload.subarray(0, 32).toString("hex");

    // Return the payload in JSON response
    return NextResponse.json({ payload: payloadHex });
  } catch (error) {
    // Handle any errors
    return NextResponse.json(
      { error: "Failed to generate payload" },
      { status: 500 }
    );
  }
}
