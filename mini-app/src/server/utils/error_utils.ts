import { TRPCError } from "@trpc/server";

export function internal_server_error(error: any, message: string) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `${message}${process.env.NODE_ENV === "development" ? `: ${error instanceof Error ? error.message : String(error)}` : ""}`,
  });
}
