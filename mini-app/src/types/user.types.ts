import { Address } from "@ton/core";
import { z } from "zod";
import { attributesArrayZod } from "./sbt.types";

export const createUserRewardLinkInputZod = z.object({
  wallet_address: z
    .string()
    .optional()
    .refine((v) => v && Address.isAddress(Address.parse(v))),
  telegram_user_id: z.number(),
  attributes: attributesArrayZod.optional(),
});

export const rewardLinkZod = z.object({
  reward_link: z.string().url(),
});

export const createUserRewardLinkReturnZod = z.object({
  status: z.enum(["success"]),
  data: rewardLinkZod,
});

export type CreateUserRewardLinkInputType = z.infer<
  typeof createUserRewardLinkInputZod
>;
export type CreateUserRewardLinkReturnType = z.infer<
  typeof createUserRewardLinkReturnZod
>;
export type RewardLinkType = z.infer<typeof rewardLinkZod>;

export type UserType = {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  wallet_address: string | null;
  language_code: string;
  role: string;
  created_at: string;
};

export type UserStoreType = {
  user: UserType | null;
  setUser: (_user: UserType) => void;
  resetUser: () => void;
};
