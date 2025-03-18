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

export const ALLOWED_TONFEST_EVENT_UUIDS = [
  "44c3e7fe-d187-445e-9794-e181d1145e10",
  "c5f9bd59-a46b-4dce-91cb-3cd146b255a5",
  "839960c1-12ec-405e-b372-be88ece4fa18",
];
