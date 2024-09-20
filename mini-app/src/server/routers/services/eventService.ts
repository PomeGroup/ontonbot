import { getEventByUuid } from "@/server/db/events";
import { TRPCError } from "@trpc/server";

const eventService = {
    // Validate event dates
    validateEventDates: (start_date: number, end_date: number) => {
        const currentTime = Date.now();
        const startDate = start_date * 1000;
        const endDate = end_date * 1000;

        if (currentTime < startDate || currentTime > endDate) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Either the event has not started or it has already ended.",
            });
        }
    },


};

export default eventService;
