import {TRPCError} from "@trpc/server";

export const throwTRPCError = (code: TRPCError['code'], message: string): never => {
    throw new TRPCError({ code, message });
};