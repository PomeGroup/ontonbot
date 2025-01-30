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
  let statusCode = 500;
  switch (err.code) {
    case "CONFLICT":
      statusCode = 409;
      break;
    case "FORBIDDEN":
      statusCode = 403;
      break;
    case "BAD_REQUEST":
      statusCode = 400;
      break;
    case "INTERNAL_SERVER_ERROR":
      statusCode = 500;
      break;
  }
  return Response.json({ message: err.message }, { status: 400 });
}
