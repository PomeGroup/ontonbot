import { NextApiRequest, NextApiResponse } from 'next';
import { CheckProofRequest } from '../dto/check-proof-request-dto';
import { TonApiService } from '../services/ton-api-service';
import { TonProofService } from '../services/ton-proof-service';
import { createAuthToken, verifyToken } from '../utils/jwt';

/**
 * Checks the proof and returns an access token.
 *
 * POST /api/check_proof
 */
const checkProof = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = CheckProofRequest.parse(await req.json());

    const client = TonApiService.create(body.network);
    const service = new TonProofService();

    const isValid = await service.checkProof(body, (address) => client.getWalletPublicKey(address));
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid proof' });
    }

    const payloadToken = body.proof.payload;
    if (!await verifyToken(payloadToken)) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const token = await createAuthToken({ address: body.address, network: body.network });

    return res.status(200).json({ token });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request', trace: e });
  }
};

export default checkProof;
