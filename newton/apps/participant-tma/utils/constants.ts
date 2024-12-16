import { Address, toNano } from "@ton/ton";

export const isTestnet = !["production", "stage", "stagin"].includes(process.env.ENV!);

export const USDT_MASTER_ADDRESS = Address.parse(
  isTestnet ? "kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy" : "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
);

export const JETTON_TRANSFER_GAS_FEES = toNano("0.038");
