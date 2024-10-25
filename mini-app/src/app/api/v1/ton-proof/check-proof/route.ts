// app/api/check-proof/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Address, Cell } from "@ton/core";
import { TonClient } from "@ton/ton";
import BN from "bn.js";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";
import { CheckProofPayload } from "@/types/ton-proof"; // adjust the import path
import { DOMAINS, PAYLOAD_TTL, PROOF_TTL, SHARED_SECRET } from "@/constants"; // adjust the import path

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { proof, address, network } = CheckProofPayload.parse(body);

    console.log(network);

    const payload = Buffer.from(proof.payload, "hex");

    if (payload.length !== 32) {
      return NextResponse.json(
        { error: `Invalid payload length, got ${payload.length}, expected 32` },
        { status: 400 }
      );
    }

    const mac = crypto.createHmac("sha256", SHARED_SECRET);
    mac.update(payload.subarray(0, 16));
    const payloadSignatureBytes = mac.digest();

    const signatureValid = payload
      .subarray(16)
      .equals(payloadSignatureBytes.subarray(0, 16));

    if (!signatureValid) {
      return NextResponse.json(
        { error: "Invalid payload signature" },
        { status: 400 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    // Check payload expiration
    const expireBytes = payload.subarray(8, 16);
    const expireTime = expireBytes.readBigUint64BE();
    if (BigInt(now) > expireTime) {
      return NextResponse.json({ error: "Payload expired" }, { status: 400 });
    }

    // Check ton proof expiration
    if (now > proof.timestamp + PROOF_TTL) {
      return NextResponse.json(
        { error: "Ton proof has expired" },
        { status: 400 }
      );
    }

    if (
      !DOMAINS.includes(proof.domain.value) &&
      !proof.domain.value.endsWith("onton.live")
    ) {
      return NextResponse.json(
        {
          error: `Wrong domain, got ${proof.domain.value}, expected ${DOMAINS.toString()}`,
        },
        { status: 400 }
      );
    }

    if (proof.domain.lengthBytes !== proof.domain.value.length) {
      return NextResponse.json(
        {
          error: `Domain length mismatched against provided length bytes of ${proof.domain.lengthBytes}`,
        },
        { status: 400 }
      );
    }

    const parsedAddress = Address.parse(address);

    const wc = Buffer.alloc(4);
    wc.writeInt32BE(parsedAddress.workChain);

    const ts = Buffer.alloc(8);
    ts.writeBigUint64LE(BigInt(proof.timestamp));

    const dl = Buffer.alloc(4);
    dl.writeUint32LE(proof.domain.value.length);

    const tonProofPrefix = "ton-proof-item-v2/";
    const msg = Buffer.concat([
      Buffer.from(tonProofPrefix),
      wc,
      parsedAddress.hash,
      dl,
      Buffer.from(proof.domain.value),
      ts,
      Buffer.from(proof.payload),
    ]);

    const msgHash = crypto.createHash("sha256").update(msg).digest();

    const tonConnectPrefix = "ton-connect";
    const fullMsg = Buffer.concat([
      Buffer.from([0xff, 0xff]),
      Buffer.from(tonConnectPrefix),
      msgHash,
    ]);

    const fullMsgHash = crypto.createHash("sha256").update(fullMsg).digest();

    // Set up the TonClient
    const client = new TonClient({
      endpoint: `https://${network === "TESTNET" ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`,
      apiKey: process.env.TON_API_TOKEN,
    });

    const executionRes = await client.runMethodWithError(
      parsedAddress,
      "get_public_key"
    );
    let pubkey: Buffer;

    if (executionRes.exit_code === 0) {
      const pubkeyNum = executionRes.stack.readBigNumber();
      const pubkeyBn = new BN(pubkeyNum.toString());
      pubkey = pubkeyBn.toBuffer("be", 32);
    } else {
      const boc = Cell.fromBase64(proof.state_init);
      const code = boc.refs[0];
      const data = boc.refs[1];
      const version = code.toBoc().toString("base64");

      switch (version) {
        case "V1R1":
        case "V1R2":
        case "V1R3":
        case "V2R1":
        case "V2R2":
          pubkey = data.asSlice().skip(32).loadBuffer(32);
          break;
        case "V3R1":
        case "V3R2":
        case "V4R1":
        case "V4R2":
          pubkey = data.asSlice().skip(64).loadBuffer(32);
          break;
        // case "V5R1": // Assuming V5R1 as a sample version for v5
        //   pubkey = data.asSlice().skip(256).loadBuffer(32);
        //   break;
        default:
          return NextResponse.json(
            { error: "Unsupported wallet version" , version:version   },
            { status: 400 }
          );
      }
    }

    //int is_extensions_not_empty = data_slice.skip_bits(size::seqno + size::wallet_id + size::public_key).preload_int(1);
    //var cs = get_data().begin_parse().skip_bits(64);

    const proofSignatureBytes = Buffer.from(proof.signature, "base64");
    const verified = nacl.sign.detached.verify(
      fullMsgHash,
      proofSignatureBytes,
      pubkey
    );

    if (!verified) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const claims = {
      exp: now + PAYLOAD_TTL,
      address: parsedAddress.toString(),
    };
    const token = jwt.sign(claims, SHARED_SECRET);

    // Return the JWT token
    return NextResponse.json({ token });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
