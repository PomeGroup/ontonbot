import { CheckProofRequest } from "@/types/ton-proof";
import { TonApiService } from "@/server/routers/services/ton-api-service";
import { TonProofService } from "@/server/routers/services/ton-proof-service";
import { createAuthToken, verifyToken } from "@/server/utils/jwt";
import { NextResponse } from "next/server";
import { SHARED_SECRET } from "@/constants";

/**
 * Checks the proof and returns an access token.
 *
 * POST /api/check_proof
 */
export const POST = async (req: Request) => {
  try {
    const body = CheckProofRequest.parse(await req.json());

    const client = TonApiService.create(body.network);
    const service = new TonProofService();

    const isValid = await service.checkProof(body, (address) => client.getWalletPublicKey(address));
    if (!isValid) {
      console.log("ton_proof_invalid_proof "  )
      return NextResponse.json(
        { error: "Invalid proof" },
        {
          status: 400,
        }
      );
    }

    const payloadToken = body.proof.payload;
    if (!(await verifyToken(payloadToken))) {
      console.log(`ton_proof_invalid_token token : ${payloadToken} SHARED_SECRET : ${SHARED_SECRET} `  )
      return NextResponse.json(
        { error: "Invalid token" },
        {
          status: 400,
        }
      );
    }

    const token = await createAuthToken({
      address: body.address,
      network: body.network,
    });

    return NextResponse.json({ token });
  } catch (e) {
    console.log(`error_check_proof : ${e}`);
    return NextResponse.json({ error: "Invalid request", trace: e }, { status: 500 });
  }
};
