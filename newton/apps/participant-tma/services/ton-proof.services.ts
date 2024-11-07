import { env } from "~/env.mjs";
import { CheckProofPayload, CheckTonProofSuccess } from "~/types/proof.types";

const tonProofBaseApi = env.NEXT_PUBLIC_API_BASE_URL_ONTON

export const generatePayload = async () => {
  const res = await fetch(`${tonProofBaseApi}/ton-proof/generate-payload`)
  if (!res.ok) {
    // FIXME: there is room for imporovment of this error handling
    throw new Error("generate-payload-failed")
  }

  const resBody = await res.json()

  return {
    ok: true,
    payload: resBody.payload
  } as const
}

export const checkProof = async (body: CheckProofPayload): Promise<CheckTonProofSuccess> => {
  const res = await fetch(`${tonProofBaseApi}/ton-proof/check-proof`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      'Content-Type': "application/json"
    }
  })

  if (!res.ok) {
    // FIXME: there is room for imporovment of this error handling
    throw new Error("check-proof-failed")
  }

  const resBody = await res.json()

  return {
    ok: true,
    ...resBody
  } as const
}

export const tonProofServices = {
  checkProof,
  generatePayload
}


