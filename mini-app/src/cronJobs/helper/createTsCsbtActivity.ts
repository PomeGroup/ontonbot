import { EventRow } from "@/db/schema/events";
import { EventPaymentSelectType } from "@/db/schema/eventPayment";
import { CreateTonSocietyDraft } from "@/server/routers/services/tonSocietyService";
import { registerActivity } from "@/lib/ton-society-api";
import { logger } from "@/server/utils/logger";

/**
 * Creates a separate "ticket activity" in TonSociety for TSCSBT.
 * The start_date is now, and the end_date matches the event’s end_date.
 * Returns the new activity_id as a number.
 */
export const createTsCsbtActivity = async (event: EventRow, paymentInfo: EventPaymentSelectType): Promise<number> => {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  const ticketDraft = await CreateTonSocietyDraft(
    {
      title: paymentInfo.title ?? "TSCSBT Ticket",
      subtitle: "",
      description: paymentInfo.description ?? "TSCSBT Ticket for the event",
      location: event.location ?? "",
      countryId: event.countryId,
      society_hub: { id: event.society_hub_id ?? "" },
      start_date: nowInSeconds,
      end_date: event.end_date,
      ts_reward_url: null,
      video_url: null,
      eventLocationType: "online",
    },
    `${event.event_uuid}-ticket`
  );

  const ticketActivityResult = await registerActivity(ticketDraft);
  const ticketActivityId = ticketActivityResult.data.activity_id;
  logger.log(`Created TSCSBT ticket activity ${ticketActivityId} for event ${event.event_uuid}`);

  return ticketActivityId;
};
