import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server";
import { NextResponse } from "next/server";
import { compressResponse } from "@/lib/compressionHelper";
import { createContext } from "@/server/context";
import { logger } from "@/server/utils/logger";

const handler = async (req: Request) => {
  const acceptEncoding = req.headers.get("accept-encoding") || "";

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    /**
     * This onError is called whenever a procedure or router throws
     * (including `TRPCError`).
     */
    onError({ error, type, path, input, ctx }) {
      logger.error(`tRPC error [${type}] on path [${path}] - ${error.message}`, {
        code: error.code,
        user: ctx?.user?.user_id,
        user_name: ctx?.user?.username,
        user_role: ctx?.user?.role,
        cause: error.cause, // if present
        input, // might contain request data
      });
    },
  });

  const text = await response.text();
  const { compressedBody, encoding } = await compressResponse(text, acceptEncoding);

  return new NextResponse(compressedBody, {
    headers: {
      "Content-Encoding": encoding,
      "Content-Type": "application/json",
    },
    status: response.status,
  });
};

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
