import { TRPCError } from "@trpc/server";

export function internal_server_error(error: any, message: string) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `${message}${process.env.ENV === "development" ? `: ${error instanceof Error ? error.message : String(error)}` : ""}`,
  });
}

/* -------------------------------------------------------------------------- */
/*                          TRPCError Error Converter                         */
/* -------------------------------------------------------------------------- */
export function handleTrpcError(err: TRPCError) {
  return Response.json({ message: err.message }, { status: 400 });
}
