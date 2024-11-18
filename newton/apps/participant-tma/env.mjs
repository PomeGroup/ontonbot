// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    BOT_TOKEN: z.string().min(1),
    ONTON_API_KEY: z.string().min(1)
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_BOT_USERNAME: z.string().min(1),
    NEXT_PUBLIC_GTM: z.string().min(1).optional(),
    NEXT_PUBLIC_API_BASE_URL: z.string().min(1),
    NEXT_PUBLIC_TON_NETWROK: z.enum(['testnet', 'mainnet']).optional(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    NEXT_PUBLIC_BOT_USERNAME: process.env.NEXT_PUBLIC_BOT_USERNAME,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_TON_NETWROK: process.env.NEXT_PUBLIC_TON_NETWROK,
    NEXT_PUBLIC_GTM: process.env.NEXT_PUBLIC_GTM,
    BOT_TOKEN: process.env.BOT_TOKEN,
    ONTON_API_KEY: process.env.ONTON_API_KEY,
  },
});
