import { z } from "zod";
import { eventManagementProtectedProcedure, router } from "../trpc";
import { addEventPoaTrigger } from "@/server/db/eventPoaTriggers.db";
import { EventTriggerStatus, EventTriggerType } from "@/db/enum";
import { getEventByUuid } from "@/server/db/events";

export const POARouter = router({
  Create: eventManagementProtectedProcedure

    .mutation(async (opts) => {

      const eventUuid =opts.ctx.event.event_uuid;
      try {
        const event = await getEventByUuid(eventUuid);
        if (!event) {
          return { success: false, message: "event not found" };
        }
        // numeric timestamp in seconds
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const poaData = {
          eventId: event.event_id,
          poaOrder: 1,
          startTime: currentTimestamp,
          countOfSent: 0,
          countOfSuccess: 0,
          poaType: "simple" as EventTriggerType , // "simple", "multiple_choice", or "question"
          status: "active" as EventTriggerStatus, // "active", "deactive", "completed", "sending"
        };

        const POAResult = await addEventPoaTrigger(poaData);
        return { success: true, message: "POA Trigger added", POAResult };
      } catch (error) {
        console.error("Error adding POA Trigger:", error);
        return {
          success: false, message: "Error adding POA Trigger",
        };
      }
    }),


});
