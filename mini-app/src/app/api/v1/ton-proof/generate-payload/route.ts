import { TonProofService } from "@/server/routers/services/ton-proof-service";
import { createPayloadToken } from "@/server/utils/jwt";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * Generates a payload for ton proof.
 *
 * POST /api/generate_payload
 */
const generatePayload = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const service = new TonProofService();
    const payload = service.generatePayload();
    const payloadToken = await createPayloadToken({ payload });

    return res.status(200).json({ payload: payloadToken });
  } catch (e) {
    return res.status(400).json({ error: "Invalid request", trace: e });
  }
};

export default generatePayload;
