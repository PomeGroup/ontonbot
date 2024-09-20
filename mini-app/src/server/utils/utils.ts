import {TRPCError} from "@trpc/server";

export const throwTRPCError = (code: TRPCError['code'], message: string): never => {
    const error = { code, message };
    console.error(`Error in throwTRPCError:`, error);
    throw new TRPCError(error);
};