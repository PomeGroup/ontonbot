import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import ticketDB from "@/server/db/ticket.db";
import { TRPCError } from "@trpc/server";
import rewardsService from "@/server/routers/services/rewardsService";
import dealRoomService from "@/server/routers/services/DealRoomService";

// Type guard to check if result is alreadyCheckedIn type
function isAlreadyCheckedIn(
  result: any
): result is { alreadyCheckedIn: boolean } {
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
      const ticket = await ticketDB.getTicketByUuid(opts.input.ticketUuid);

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
      const result = await ticketDB.checkInTicket(opts.input.ticketUuid);
      console.log("result", result);
      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check in the ticket",
        });
      }

      const ticketData = await ticketDB.getTicketByUuid(opts.input.ticketUuid);

      if (ticketData && ticketData?.user_id && ticketData?.event_uuid) {
        // Create a reward for the user
        const rewardResult = await rewardsService.createUserRewardSBT({
          user_id: ticketData.user_id,
          event_uuid: ticketData.event_uuid,
          ticketOrderUuid: ticketData.order_uuid,
        });
        if (!rewardResult.success) {
          console.log("rewardResult", rewardResult);
        }
        if (isAlreadyCheckedIn(result)) {
          return { alreadyCheckedIn: true, result: result };
        }
        const dealRoomResult = await dealRoomService.RefreshGuestList("2742f5902ad54152a969f5dac15d716d");
        return {
          checkInSuccess: true,
          result: result,
          dealRoomResult: dealRoomResult,
          rewardResult: rewardResult,
        };
      }
    }),
});
