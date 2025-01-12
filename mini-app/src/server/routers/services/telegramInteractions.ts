import { eventManagementProtectedProcedure as evntManagerPP, initDataProtectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { getEventByUuid, selectEventByUuid } from "@/server/db/events";
import { logger } from "@/server/utils/logger";
import telegramService from "@/server/routers/services/telegramService";
import { TRPCError } from "@trpc/server";
import { router } from "@/server/trpc";
import { db } from "@/db/db";
import { eventRegistrants } from "@/db/schema/eventRegistrants";
import { users } from "@/db/schema/users";
import { and, eq, or } from "drizzle-orm";
import Papa from "papaparse";
import { selectVisitorsByEventUuid } from "@/server/db/visitors";
import { VisitorsWithDynamicFields } from "@/server/db/dynamicType/VisitorsWithDynamicFields";
import axios from "axios";
import { getSBTClaimedStaus } from "@/lib/ton-society-api";

const requestShareEvent = initDataProtectedProcedure
  .input(
    z.object({
      eventUuid: z.string(), // Accept only the event UUID
      platform: z.string().optional(), // Optional platform (e.g., "telegram", "twitter")
    })
  )
  .mutation(async (opts) => {
    try {
      const { eventUuid } = opts.input;

      // Step 1: Fetch the event data by UUID
      const event = await getEventByUuid(eventUuid);

      if (!event) {
        logger.log(`Event not found ${eventUuid} for user ${opts.ctx.user.user_id}`, opts);
        return { status: "fail", data: `Event not found  ${eventUuid}` };
      }

      const { event_uuid } = event;
      // Step 2: Make the request to share the event
      const result = await telegramService.shareEventRequest(opts.ctx.user.user_id.toString(), event_uuid.toString());

      if (result.success) {
        // logger.log("Event shared successfully:", result.data);
        return { status: "success", data: null };
      } else {
        logger.error("Failed to share the event:", result.error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to share the event",
          cause: result.error,
        });
      }
    } catch (error) {
      logger.error("Error while sharing event: ", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to share the event",
        cause: error,
      });
    }
  });

const requestExportFile = evntManagerPP.mutation(async (opts) => {
  const event_uuid = opts.input.event_uuid;
  const event = opts.ctx.event;
  const dynamic_fields = !(event.has_registration && event.participationType === "in_person");

  const eventData = await selectEventByUuid(event_uuid);

  let csvString = "";
  let count = 0;

  /* -------------------------------------------------------------------------- */
  /*                              EVENT REGISTRANTS                             */
  /* -------------------------------------------------------------------------- */
  if (eventData?.has_registration) {
    const condition = eventData.has_payment
      ? and(
          or(eq(eventRegistrants.status, "approved"), eq(eventRegistrants.status, "checkedin")),
          eq(eventRegistrants.event_uuid, event_uuid)
        )
      : eq(eventRegistrants.event_uuid, event_uuid);

    const result = await db
      .select()
      .from(eventRegistrants)
      .innerJoin(users, eq(eventRegistrants.user_id, users.user_id))
      .where(condition)
      .execute();

    count = result.length;
    /* -------------------------------------------------------------------------- */

    /* ------------------------ Get Sbt Claims In Chunks ------------------------ */
    const chunkArray = (array: any, size: any) => {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    };

    const processInBatches = async (data: any, batchSize: any) => {
      const chunks = chunkArray(data, batchSize);
      const result = [];

      for (const chunk of chunks) {
        const batchResult = await Promise.all(
          chunk.map(async (row: any) => {
            const registerInfo =
              typeof row.event_registrants.register_info === "object"
                ? row.event_registrants.register_info
                : JSON.parse(String(row.event_registrants.register_info || "{}"));

            const sbtClaimStatus = await getSBTClaimedStaus(eventData.activity_id!, row.users.user_id);

            const expandedRow = {
              ...row.event_registrants,
              ...row.users,
              ...registerInfo,
              sbt_claim_status: sbtClaimStatus.status,
            };

            delete expandedRow.register_info;

            return expandedRow;
          })
        );
        result.push(...batchResult);
      }

      return result;
    };

    // Call the function with a batch size
    const batchSize = 50; // Adjust based on API limits
    const dataForCsv = await processInBatches(result, batchSize);
    /* ----------------------------------- END ---------------------------------- */

    /* -------------------------------------------------------------------------- */
    /*                                 CSV CREATE                                 */
    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */
    csvString = Papa.unparse(dataForCsv || [], {
      header: true,
    });
  } else {
    /* -------------------------------------------------------------------------- */
    /*                                  VISITORS                                  */
    /* -------------------------------------------------------------------------- */
    const chunkArray = (array: any, size: number) => {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    };

    const processVisitorsInBatches = async (visitors: any, batchSize: any) => {
      const chunks = chunkArray(visitors, batchSize);
      const result = [];

      for (const chunk of chunks) {
        const batchResult = await Promise.all(
          chunk.map(async (visitor: any) => {
            const visitorData: Partial<VisitorsWithDynamicFields> = {
              ...visitor,
              ticket_status: "ticket_status" in visitor ? (visitor.ticket_status ?? undefined) : undefined,
              wallet_address: visitor.wallet_address as string | null | undefined,
              username: visitor.username === "null" ? null : visitor.username,
            };

            if (!eventData?.ticketToCheckIn && "has_ticket" in visitorData) {
              delete visitorData.has_ticket;
              delete visitorData.ticket_status;
              delete visitorData.ticket_id;
            }

            const sbtClaimStatus = await getSBTClaimedStaus(eventData?.activity_id!, visitorData.user_id!);

            return {
              ...visitorData,
              // dynamicFields: JSON.stringify(visitor.dynamicFields),
              sbt_claim_status: sbtClaimStatus.status,
            };
          })
        );
        result.push(...batchResult);
      }

      return result;
    };

    const visitors = await selectVisitorsByEventUuid(opts.input.event_uuid, -1, 0, dynamic_fields, "");
    const batchSize = 50; // Adjust batch size as needed
    const dataForCsv = await processVisitorsInBatches(visitors.visitorsWithDynamicFields, batchSize);

    csvString = Papa.unparse(dataForCsv || [], {
      header: true,
    });
    count = visitors.visitorsWithDynamicFields?.length || 0;
  }
  /* -------------------------------------------------------------------------- */
  /*                                  SEND CSV                                  */
  /* -------------------------------------------------------------------------- */
  try {
    const formData = new FormData();

    // Add BOM at the beginning of the CSV string for UTF-8 encoding
    const bom = "\uFEFF";
    const csvContentWithBom = bom + csvString;

    const fileBlob = new Blob([csvContentWithBom], {
      type: "text/csv;charset=utf-8;",
    });
    formData.append("file", fileBlob, "visitors.csv");
    // Include the custom message in the form data
    let customMessage = "Here is the guest list for your event.";
    if (eventData && eventData?.title) {
      customMessage = `📂 Download Guest List Report \n\n🟢 ${eventData?.title} \n\n👤 Count of Guests ${count}`;
    }
    formData.append("message", customMessage);
    formData.append("fileName", eventData?.title || "visitors");
    const userId = opts.ctx.user.user_id;
    const response = await axios.post(
      `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/send-file?id=${userId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.status === 200 ? { status: "success", data: null } : { status: "fail", data: response.data };
  } catch (error) {
    logger.error("Error while sending file: ", error);
    return { status: "fail", data: null };
  }
});

const requestSendQRCode = evntManagerPP
  .input(z.object({ url: z.string(), hub: z.string().optional() }))
  .mutation(async (opts) => {
    try {
      const response = await axios.get(
        `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/generate-qr`,
        {
          params: {
            id: opts.ctx.user.user_id,
            url: opts.input.url,
            hub: opts.input.hub,
          },
        }
      );

      return response.status === 200 ? { status: "success", data: null } : { status: "fail", data: response.data };
    } catch (error) {
      logger.error("Error while generating QR Code: ", error);
      return { status: "fail", data: null };
    }
  });
export const telegramInteractionsRouter = router({
  requestShareEvent,
  requestExportFile,
  requestSendQRCode,
});
