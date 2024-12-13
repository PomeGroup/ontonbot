import { eventManagementProtectedProcedure, router } from "../trpc";
import { addEventPoaTrigger } from "@/server/db/eventPoaTriggers.db";
import {EventTriggerStatus, eventTriggerType, EventTriggerType} from "@/db/enum";
import { getEventByUuid } from "@/server/db/events";
import {z} from "zod";

export const POARouter = router({
  Create: eventManagementProtectedProcedure
      .input(
          z.object({
              poa_type: z.enum(eventTriggerType.enumValues).optional(),
          })
      )
    .mutation(async (opts) => {

      const eventUuid =opts.ctx.event.event_uuid;
      try {
        const event = await getEventByUuid(eventUuid);
        if (!event) {
          return { success: false, message: "event not found" };
        }
        // poa type to uppercase
          const poaType = opts.input.poa_type  as EventTriggerType;
        if (!opts.input?.poa_type || !eventTriggerType.enumValues.includes(poaType)) {
            return { success: false, message: "Invalid POA Type" };
        }
        // numeric timestamp in seconds
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const poaData = {
          eventId: event.event_id,
          poaOrder: 1,
          startTime: currentTimestamp,
          countOfSent: 0,
          countOfSuccess: 0,
          poaType:  poaType ,
          status: "active" as EventTriggerStatus,
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
