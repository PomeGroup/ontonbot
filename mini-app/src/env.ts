// ./env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { Address } from "@ton/ton";
import { z } from "zod";

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    BOT_TOKEN: z.string().min(1),
    ONTON_API_KEY: z.string().min(1),
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
  },
  /*
   * Destructure variables to include them in both client and server bundles.
   *
   * Type errors if not all variables from `server` & `client` are included.
   */
  runtimeEnv: {
    NEXT_PUBLIC_BOT_USERNAME: process.env.NEXT_PUBLIC_BOT_USERNAME as string,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL as string,
    NEXT_PUBLIC_GTM: process.env.NEXT_PUBLIC_GTM || undefined,
    BOT_TOKEN: process.env.BOT_TOKEN as string,
    ONTON_API_KEY: process.env.ONTON_API_KEY as string,
  },
});
