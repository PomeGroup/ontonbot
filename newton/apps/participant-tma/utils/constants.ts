import { Address } from "@ton/ton";
import { env } from "~/env.mjs";

export const isTestnet = !(/*NOT*/ ["production", "stage", "staging"].includes(env.NEXT_PUBLIC_ENV));

// __AUTO_GENERATED_PRINT_VAR_START__
console.log(" isTestnet: %s", isTestnet); // __AUTO_GENERATED_PRINT_VAR_END__
console.log("ENV  VARIABLES", env);
console.log("ENV ", env.NEXT_PUBLIC_ENV);

export const USDT_MASTER_ADDRESS = Address.parse(
  isTestnet ? "kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy" : "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
);
