"use server";

import { Address } from "@ton/ton";
import { z } from "zod";

import { env } from "../../../env.mjs";

const buyTicketSchema = z.object({
  owner_address: z.string().refine((v) => Address.isAddress(Address.parse(v))),
  telegram: z.string(),
  boc: z.string(),
  full_name: z.string(),
  event_id: z.string().uuid(),
  company: z.string(),
  position: z.string(),
  user_id: z
    .string()
    .refine((v) => !isNaN(parseInt(v)))
    .transform((v) => parseInt(v)),
});

export async function buyTicket(_: any, formData: FormData) {
  const validateBuyTicketFields = buyTicketSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!validateBuyTicketFields.success) {
    return {
      errors: validateBuyTicketFields.error.flatten().fieldErrors,
      ok: false,
    } as const;
  }

  const data: {
    owner_address: string;
    boc: string;
    telegram: string;
    full_name: string;
    event_id: string;
    user_id: number;
    company?: string | undefined;
    position?: string | undefined;
  } = validateBuyTicketFields.data;

  const body = JSON.stringify(data);

  const mintReq = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/ticket/mint-request`,
    {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ONTON_API_KEY,
      },
    }
  );

  if (mintReq.status === 201) {
    return { message: "bought ticket", ok: true } as const;
  }

  return {
    errors: { all: "invalid data" },
    ok: false,
  } as const;
}
