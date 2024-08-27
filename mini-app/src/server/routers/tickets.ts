import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { getTicketByUuid, checkInTicket } from "@/server/db/tickets";
import { TRPCError } from "@trpc/server";

// Type guard to check if result is alreadyCheckedIn type
function isAlreadyCheckedIn(result: any): result is { alreadyCheckedIn: boolean } {
    return result && "alreadyCheckedIn" in result;
}

export const ticketRouter = router({
    getTicketByUuid: publicProcedure
        .input(
            z.object({
                ticketUuid: z.string(),
            })
        )
        .query(async (opts) => {
            const ticket = await getTicketByUuid(opts.input.ticketUuid);

            if (!ticket) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Ticket not found",
                });
            }

            return ticket;
        }),

    checkInTicket: publicProcedure
        .input(
            z.object({
                ticketUuid: z.string(),
            })
        )
        .mutation(async (opts) => {
            const result = await checkInTicket(opts.input.ticketUuid);

            if (!result) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to check in the ticket",
                });
            }

            if (isAlreadyCheckedIn(result)) {
                return { alreadyCheckedIn: true };
            }

            return result;
        }),
});
