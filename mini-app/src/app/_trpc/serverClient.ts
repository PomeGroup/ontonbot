import { appRouter } from "@/server";
import { trpcApiInstance } from "@/server/trpc";

export const serverClient = trpcApiInstance.createCallerFactory(appRouter);
