import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server";
import { NextResponse } from "next/server";
import { compressResponse } from "@/lib/compressionHelper";
import { createContext } from "@/server/context";

const handler = async (req: Request) => {
  const acceptEncoding = req.headers.get("accept-encoding") || "";

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
  });

  const text = await response.text();
  const { compressedBody, encoding } = await compressResponse(
    text,
    acceptEncoding
  );

  return new NextResponse(compressedBody, {
    headers: {
      "Content-Encoding": encoding,
      "Content-Type": "application/json",
    },
    status: response.status,
  });
};

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
