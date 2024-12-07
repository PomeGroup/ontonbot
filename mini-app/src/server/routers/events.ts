import { db } from "@/db/db";
import { eventFields, events, eventRegistrants, users, EventTriggerType, eventPayment } from "@/db/schema";
import { fetchCountryById } from "@/server/db/giataCity.db";

import { hashPassword } from "@/lib/bcrypt";
import { sendLogNotification } from "@/lib/tgBot";
import { registerActivity, tonSocietyClient, updateActivity } from "@/lib/ton-society-api";
import { getObjectDifference, removeKey } from "@/lib/utils";
import { VisitorsWithDynamicFields } from "@/server/db/dynamicType/VisitorsWithDynamicFields";
import { EventDataSchema, HubsResponse, UpdateEventDataSchema, EventRegisterSchema } from "@/types";

import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import dotenv from "dotenv";
import { and, asc, count, desc, eq, ne, or } from "drizzle-orm";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getEventByUuid, getEventsWithFilters, selectEventByUuid } from "../db/events";
import { selectVisitorsByEventUuid } from "../db/visitors";
import { adminOrganizerProtectedProcedure, eventManagementProtectedProcedure, initDataProtectedProcedure, publicProcedure, router } from "../trpc";
import { TonSocietyRegisterActivityT } from "@/types/event.types";
import eventFieldsDB from "@/server/db/eventFields.db";
import telegramService from "@/server/routers/services/telegramService";
import rewardService from "@/server/routers/services/rewardsService";
import { addVisitor } from "@/server/db/visitors";
import { eventPoaTriggersDB } from "@/server/db/eventPoaTriggers";
import { internal_server_error } from "../utils/error_utils";

dotenv.config();

const PLACEHOLDER_IMAGE = "https://storage.onton.live/ontonimage/test_image.png";
const PLACEHOLDER_VIDEO = "https://storage.onton.live/ontonvideo/event/dCsiY_1731355946593_event_video.mp4";

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */
function timestampToIsoString(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return date.toISOString();
}

const formatChanges = (changes: any) => JSON.stringify(changes ? removeKey(changes, "secret_phrase") : null, null, 2);

async function getRegistrantRequest(event_uuid: string, user_id: number) {
  const result = (
    await db
      .select()
      .from(eventRegistrants)
      .where(and(eq(eventRegistrants.event_uuid, event_uuid), eq(eventRegistrants.user_id, user_id)))
      .execute()
  ).pop();

  return result;
}
async function getApprovedRequestsCount(event_uuid: string) {
  const approved_requests_count =
    (
      await db
        .select({ count: count() })
        .from(eventRegistrants)
        .where(
          and(or(eq(eventRegistrants.status, "approved"), eq(eventRegistrants.status, "checkedin")), eq(eventRegistrants.event_uuid, event_uuid))
        )
        .execute()
    ).pop()?.count || 0;
  return approved_requests_count;
}

async function getNotRejectedRequestsCount(event_uuid: string) {
  const notrejected_requests_count =
    (
      await db
        .select({ count: count() })
        .from(eventRegistrants)
        .where(and(ne(eventRegistrants.status, "rejected"), eq(eventRegistrants.event_uuid, event_uuid)))
        .execute()
    ).pop()?.count || 0;
  return notrejected_requests_count;
}

/* //FIXME  -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                EVENT ROUTER                                */
/* -------------------------------------------------------------------------- */

export const eventsRouter = router({
  // // private
  // getVisitorsWithWalletsNumber: eventManagementProtectedProcedure.query(
  //   async (opts) => {
  //     return (
  //       (await selectVisitorsWithWalletAddress(opts.ctx.event.event_uuid))
  //         .length || 0
  //     );
  //   }
  // ),

  // getWalletBalance: publicProcedure.input(z.string()).query(async (opts) => {
  //   return await fetchBalance(opts.input);
  // }),
  /* -------------------------------------------------------------------------- */
  /*                            📢 Get an Event By User                        */
  /* -------------------------------------------------------------------------- */
  getEvent: initDataProtectedProcedure.input(z.object({ event_uuid: z.string() })).query(async (opts) => {
    // try {
    //   const eventVisitor = await findVisitorByUserAndEventUuid(
    //     opts.ctx.user.user_id,
    //     opts.input.event_uuid
    //   );
    //   if (eventVisitor) {
    //     await updateVisitorLastVisit(eventVisitor.id);
    //   }
    // } catch (error) {
    //   console.error("Error at updating visitor", error);
    // }
    // console.log("event_uuid", opts.input.event_uuid);
    const userId = opts.ctx.user.user_id;
    const event_uuid = opts.input.event_uuid;
    const eventData = { ...(await selectEventByUuid(event_uuid)), payment_details: {} };
    let capacity_filled = false;
    let registrant_status: "pending" | "rejected" | "approved" | "checkedin" | "" = "";
    let registrant_uuid = "";

    if (!eventData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "event not found",
      });
    }
    if (!eventData.has_registration) {
      return { capacity_filled, registrant_status, ...eventData, registrant_uuid };
    }

    /* ------------------------ Event Needs Registration ------------------------ */

    const user_request = await getRegistrantRequest(event_uuid, userId);
    const event_location = eventData.location;

    const userIsAdminOrOwner = eventData.owner == userId || opts.ctx.user.role == "admin";
    let mask_event_capacity = !userIsAdminOrOwner;

    eventData.location = "Visible To Registered Users";

    if (userIsAdminOrOwner) {
      eventData.location = event_location;
      if (eventData.has_payment) {
        const payment_details = (await db.select().from(eventPayment).where(eq(eventPayment.event_uuid, event_uuid)).execute()).pop();
        if (!payment_details) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Event Payment Data Not found (Corrupted Event)",
          });
        }
        eventData.payment_details = { ...payment_details };
      }
    }

    // Registrant Already has a request
    if (user_request) {
      registrant_status = user_request.status;
      if (registrant_status === "approved" || registrant_status === "checkedin") {
        eventData.location = event_location;
        registrant_uuid = user_request.registrant_uuid;
      }
      return {
        capacity_filled,
        registrant_status,
        ...eventData,
        registrant_uuid,
        capacity: mask_event_capacity ? 99 : eventData.capacity,
      };
    }

    // no status for registran
    if (eventData.capacity) {
      const approved_requests_count = await getApprovedRequestsCount(event_uuid);
      if (approved_requests_count >= eventData.capacity) {
        // Event capacity filled
        capacity_filled = true;
        return {
          capacity_filled,
          registrant_status,
          ...eventData,
          registrant_uuid,
          capacity: mask_event_capacity ? 99 : eventData.capacity,
        };
      }
    }

    // NO Status
    return {
      capacity_filled,
      registrant_status,
      ...eventData,
      registrant_uuid,
      capacity: mask_event_capacity ? 99 : eventData.capacity,
    };

    /* -------------------------------------------------------------------------- */
  }),

  // private
  getEvents: adminOrganizerProtectedProcedure.query(async (opts) => {
    let eventsData = [];

    if (opts.ctx.userRole === "admin") {
      eventsData = await db.select().from(events).where(eq(events.hidden, false)).orderBy(desc(events.created_at)).execute();
    } else if (opts.ctx.userRole === "organizer") {
      eventsData = await db
        .select()
        .from(events)
        .where(and(eq(events.hidden, false), eq(events.owner, opts.ctx.user.user_id)))
        .orderBy(desc(events.created_at))
        .execute();
    } else {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized access, invalid role",
      });
    }

    return eventsData.map((restEventData) => removeKey(restEventData, "wallet_seed_phrase"));
  }),

  /* -------------------------------------------------------------------------- */
  /*                           📝 Event Register by user                       */
  /* -------------------------------------------------------------------------- */
  // private
  eventRegister: initDataProtectedProcedure.input(EventRegisterSchema).mutation(async (opts) => {
    const userId = opts.ctx.user.user_id;
    const { event_uuid, ...registerInfo } = opts.input;
    const event = await selectEventByUuid(event_uuid);

    // console.log("event_register", event_uuid, userId);

    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "event not found" });
    }

    if (!event.has_registration) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "event is not registrable",
      });
    }
    const user_request = await getRegistrantRequest(event_uuid, userId);

    if (user_request) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `registrant already has a [${user_request.status}] Request `,
      });
    }

    let event_filled_and_has_waiting_list = false;

    if (event.capacity) {
      const approved_requests_count = await getApprovedRequestsCount(event_uuid);
      const event_cap_filled = approved_requests_count >= event.capacity;

      event_filled_and_has_waiting_list = !!(event_cap_filled && event.has_waiting_list);

      if (event_cap_filled && !event.has_waiting_list) {
        // Event capacity filled and no waiting list
        throw new TRPCError({
          code: "CONFLICT",
          message: `Event Capacity Reached`,
        });
      }
    }

    const request_status = !!event.has_approval || event_filled_and_has_waiting_list ? "pending" : "approved"; // pending if approval is required otherwise auto approve them

    await db.insert(eventRegistrants).values({
      event_uuid: event_uuid,
      user_id: userId,
      status: request_status,
      register_info: registerInfo,
    });
    await addVisitor(userId, event_uuid);

    return { message: "success", code: 201 };
  }),

  /* -------------------------------------------------------------------------- */
  /*                            Get Event Registrant 👨‍👩‍👧                        */
  /* -------------------------------------------------------------------------- */
  getEventRegistrants: eventManagementProtectedProcedure.input(z.object({ event_uuid: z.string() })).query(async (opts) => {
    const event_uuid = opts.input.event_uuid;
    const event = await selectEventByUuid(event_uuid);

    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "event not found" });
    }

    const registrants = await db
      .select({
        event_uuid: eventRegistrants.event_uuid,
        user_id: eventRegistrants.user_id,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        status: eventRegistrants.status,
        created_at: eventRegistrants.created_at,
        regisrtant_info: eventRegistrants.register_info,
      })
      .from(eventRegistrants)
      .innerJoin(users, eq(eventRegistrants.user_id, users.user_id))
      .where(eq(eventRegistrants.event_uuid, event_uuid))
      .orderBy(asc(eventRegistrants.created_at))
      .execute();

    return registrants;
  }),

  /* -------------------------------------------------------------------------- */
  /*              Process Registrant Request (Approve✅ / Reject ❌)           */
  /* -------------------------------------------------------------------------- */
  processRegistrantRequest: eventManagementProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string(),
        user_id: z.number(),
        status: z.enum(["approved", "rejected"]),
      })
    )
    .mutation(async (opts) => {
      const event_uuid = opts.input.event_uuid;
      const user_id = opts.input.user_id;
      const event = await selectEventByUuid(event_uuid);

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "event not found" });
      }

      await db
        .update(eventRegistrants)
        .set({
          status: opts.input.status,
        })
        .where(and(eq(eventRegistrants.event_uuid, event_uuid), eq(eventRegistrants.user_id, user_id), ne(eventRegistrants.status, "checkedin")))
        .execute();

      if (opts.input.status === "approved") {
        const share_link = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${event_uuid}`;
        const response = await telegramService.sendEventPhoto({
          event_id: event.event_uuid,
          user_id: user_id,
          message: `✅ Your request has been approved for the event : <b>${event.title}</b> \n${share_link}`,
        });
        console.log("*******approved_guest", response.status, response.message);
      }

      return { code: 201, message: "ok" };
    }),

  /* -------------------------------------------------------------------------- */
  /*                  Check-in Registrant Request (🙋‍♂️💁‍♂️)                  */
  /* -------------------------------------------------------------------------- */
  checkinRegistrantRequest: eventManagementProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string().uuid(),
        registrant_uuid: z.string().uuid(),
      })
    )
    .mutation(async (opts) => {
      const event_uuid = opts.input.event_uuid;
      const event = await selectEventByUuid(event_uuid);
      const registrant_uuid = opts.input.registrant_uuid;

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "event not found" });
      }
      if (!event.has_registration || event.participationType !== "in_person") {
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message: "Check-in only for in_person events with registration",
        });
      }
      const registrant = (await db.select().from(eventRegistrants).where(eq(eventRegistrants.registrant_uuid, registrant_uuid)).execute()).pop();

      if (!registrant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registrant Not Found/Invalid" });
      }
      if (registrant.event_uuid !== event_uuid) {
        throw new TRPCError({ code: "CONFLICT", message: "Registrant Not for this event" });
      }

      if (registrant.status === "checkedin") {
        return { code: 200, message: "Already Checked-in" };
      }
      if (registrant.status !== "approved") {
        throw new TRPCError({ code: "CONFLICT", message: "Registrant Not Approved" });
      }

      await db
        .update(eventRegistrants)
        .set({
          status: "checkedin",
        })
        .where(eq(eventRegistrants.registrant_uuid, registrant_uuid))
        .execute();

      await rewardService.createUserReward({
        user_id: registrant.user_id as number,
        event_uuid: event_uuid,
      });
      return { code: 200, message: "ok" };
    }),
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /*                                  🆕Add Event🆕                            */
  /* -------------------------------------------------------------------------- */
  // private
  addEvent: adminOrganizerProtectedProcedure
    .input(
      z.object({
        eventData: EventDataSchema,
      })
    )
    .mutation(async (opts) => {
      const input_event_data = opts.input.eventData;
      try {
        const result = await db.transaction(async (trx) => {
          const countryId = input_event_data.countryId;
          const country = countryId ? await fetchCountryById(countryId) : undefined;

          const inputSecretPhrase = input_event_data.secret_phrase.trim().toLowerCase();

          const hashedSecretPhrase = Boolean(inputSecretPhrase) ? await hashPassword(inputSecretPhrase) : undefined;

          if (!hashedSecretPhrase) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid secret phrase",
            });
          }

          /* ------------------------------ Invalid Dates ----------------------------- */
          if (!input_event_data.end_date || !input_event_data.start_date) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid start-date/end-date",
            });
          }
          /* ------------------------- Event Duration > 1 Week ------------------------ */
          //FIXME -  Discuss With Mike

          // if (input_event_data.end_date! - input_event_data.start_date > 604801) {
          //   throw new TRPCError({
          //     code: "BAD_REQUEST",
          //     message: "Event Duration Can't be more than 1 week",
          //   });
          // }

          const newEvent = await trx
            .insert(events)
            .values({
              type: input_event_data.type,
              event_uuid: uuidv4(),
              title: input_event_data.title,
              subtitle: input_event_data.subtitle,
              description: input_event_data.description,
              image_url: input_event_data.image_url,
              society_hub: input_event_data.society_hub.name,
              society_hub_id: input_event_data.society_hub.id,
              secret_phrase: hashedSecretPhrase,
              start_date: input_event_data.start_date,
              end_date: input_event_data.end_date,
              timezone: input_event_data.timezone,
              location: input_event_data.location,
              owner: opts.ctx.user.user_id,
              participationType: input_event_data.eventLocationType,
              countryId: input_event_data.countryId,
              tsRewardImage: input_event_data.ts_reward_url,
              tsRewardVideo: input_event_data.video_url,
              cityId: input_event_data.cityId,

              //Event Registration
              has_registration: input_event_data.has_registration,
              has_approval: input_event_data.has_approval,
              capacity: input_event_data.capacity,
              has_waiting_list: input_event_data.has_waiting_list,
              //Event Registration

              //Paid Event
              has_payment: input_event_data.paid_event?.has_payment,
              ticketToCheckIn : input_event_data.paid_event?.has_payment, // Duplicated Column same as has_payment 😐
            })
            .returning();

          /* -------------------------------------------------------------------------- */
          /*                     Paid Event : Insert PayMent Details                    */
          /* -------------------------------------------------------------------------- */
          if (input_event_data.paid_event && input_event_data.paid_event.has_payment) {
            await trx.insert(eventPayment).values({
              event_uuid: newEvent[0].event_uuid,
              /* -------------------------------------------------------------------------- */
              payment_type: input_event_data.paid_event.payment_type || "TON",
              price: input_event_data.paid_event.payment_amount || 1,
              recipient_address: input_event_data.paid_event.payment_recipient_address,
              /* -------------------------------------------------------------------------- */
              ticket_type: input_event_data.paid_event.has_nft ? "NFT" : "OFFCHAIN",
              ticketImage: input_event_data.paid_event.nft_image_url,
              collectionAddress: null,
            });
          }

          // Insert dynamic fields
          for (let i = 0; i < input_event_data.dynamic_fields.length; i++) {
            const field = input_event_data.dynamic_fields[i];
            await eventFieldsDB.insertEventField(trx, {
              emoji: field.emoji,
              title: field.title,
              description: field.description,
              placeholder: field.type === "button" ? field.url : field.placeholder,
              type: field.type,
              order_place: i,
              event_id: newEvent[0].event_id,
              updatedBy: opts.ctx.user.user_id.toString(),
            });
          }
          // Generate POA for the event
          if (input_event_data.eventLocationType === "online") {
            await eventPoaTriggersDB.generatePoaForAddEvent(trx, {
              eventId: newEvent[0].event_id,
              eventStartTime: newEvent[0].start_date || 0,
              eventEndTime: newEvent[0].end_date || 0,
              poaCount: 3,
              poaType: "simple" as EventTriggerType,
            });
          }

          // Insert secret phrase field if applicable
          if (inputSecretPhrase) {
            await eventFieldsDB.insertEventField(trx, {
              emoji: "🔒",
              title: "secret_phrase_onton_input",
              description: "Enter the event password",
              placeholder: "Enter the event password",
              type: "input",
              order_place: input_event_data.dynamic_fields.length,
              event_id: newEvent[0].event_id,
              updatedBy: opts.ctx.user.user_id.toString(),
            });
          }

          const additional_info = z.string().url().safeParse(input_event_data.location).success ? "Online" : input_event_data.location;

          const eventDraft: TonSocietyRegisterActivityT = {
            title: input_event_data.title,
            subtitle: input_event_data.subtitle,
            description: input_event_data.description,
            hub_id: parseInt(input_event_data.society_hub.id),
            start_date: timestampToIsoString(input_event_data.start_date),
            end_date: timestampToIsoString(input_event_data.end_date!),
            additional_info,
            cta_button: {
              link: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${newEvent[0].event_uuid}`,
              label: "Enter Event",
            },
            ...(input_event_data.ts_reward_url
              ? {
                  rewards: {
                    mint_type: "manual",
                    collection: {
                      title: input_event_data.title,
                      description: input_event_data.description,
                      image: {
                        url: process.env.ENV !== "local" ? input_event_data.ts_reward_url : PLACEHOLDER_IMAGE,
                      },
                      cover: {
                        url: process.env.ENV !== "local" ? input_event_data.ts_reward_url : PLACEHOLDER_IMAGE,
                      },
                      item_title: input_event_data.title,
                      item_description: "Reward for participation",
                      item_image: {
                        url: process.env.ENV !== "local" ? input_event_data.ts_reward_url : PLACEHOLDER_IMAGE,
                      },
                      ...(input_event_data.video_url
                        ? {
                            item_video: {
                              url:
                                process.env.ENV !== "local"
                                  ? new URL(input_event_data.video_url).origin + new URL(input_event_data.video_url).pathname
                                  : PLACEHOLDER_VIDEO,
                            },
                          }
                        : {}),
                      item_metadata: {
                        activity_type: "event",
                        place: {
                          type: input_event_data.eventLocationType === "online" ? "Online" : "Offline",
                          ...(country && country?.abbreviatedCode
                            ? {
                                country_code_iso: country.abbreviatedCode,
                                venue_name: input_event_data.location,
                              }
                            : {
                                venue_name: input_event_data.location, // Use location regardless of country
                              }),
                        },
                      },
                    },
                  },
                }
              : {}),
          };

          console.log("eventDraft", JSON.stringify(eventDraft));
          // Ensure eventDataUpdated is accessed correctly as an object
          const eventData = newEvent[0]; // Ensure this is an object, assuming the update returns an array
          console.log("eventData", eventData);

          // Remove the description key
          const eventDataWithoutDescription = removeKey(eventData, "description");
          await sendLogNotification({
            message: `
@${opts.ctx.user.username} <b>Added</b> a new event <code>${newEvent[0].event_uuid}</code> successfully

<pre><code>${formatChanges(eventDataWithoutDescription)}</code></pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${newEvent[0].event_uuid}
            `,
          });

          // On local development environment, we skip the registration on ton society
          if (process.env.ENV !== "local") {
            const res = await registerActivity(eventDraft);

            await trx
              .update(events)
              .set({
                activity_id: res.data.activity_id,
                updatedBy: opts.ctx.user.user_id.toString(),
                updatedAt: new Date(),
              })
              .where(eq(events.event_uuid, newEvent[0].event_uuid as string))
              .execute();
          }

          return newEvent;
        });

        return {
          success: true,
          eventId: result[0].event_id,
          eventHash: result[0].event_uuid,
        } as const;
      } catch (error) {
        console.error(`Error while adding event: ${Date.now()} , ${error}`);
        if (error instanceof TRPCError) {
          throw error;
        }
        internal_server_error(error, "Internal Error while adding event");
      }
    }),
  // private
  //   deleteEvent: eventManagementProtectedProcedure.mutation(async (opts) => {
  //     try {
  //       return await db.transaction(async (trx) => {
  //         const deletedEvent = await trx
  //           .update(events)
  //           .set({
  //             hidden: true,
  //             updatedBy: "system-delete",
  //             updatedAt: new Date(),
  //           }) // Set the 'hidden' field to true
  //           .where(eq(events.event_uuid, opts.input.event_uuid))
  //           .returning();

  //         await sendLogNotification({
  //           message: `
  // @${opts.ctx.user.username} <b>Deleted</b> an event <code>${deletedEvent[0].event_uuid}</code>.

  // <pre><code>${JSON.stringify(deletedEvent[0], null, 2)}</code></pre>
  // `,
  //         });

  //         return { success: true };
  //       });
  //     } catch (error) {
  //       console.error(error);
  //       return { success: false };
  //     }
  //   }),

  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /*                                Update Event                                */
  /* -------------------------------------------------------------------------- */
  // private
  updateEvent: eventManagementProtectedProcedure
    .input(
      z.object({
        eventData: UpdateEventDataSchema,
      })
    )
    .mutation(async (opts) => {
      const eventData = opts.input.eventData;
      const eventUuid = opts.ctx.event.event_uuid;
      const eventId = opts.ctx.event.event_id;

      try {
        return await db.transaction(async (trx) => {
          const inputSecretPhrase = eventData.secret_phrase ? eventData.secret_phrase.trim().toLowerCase() : undefined;

          const hashedSecretPhrase = inputSecretPhrase ? await hashPassword(inputSecretPhrase) : undefined;

          const oldEvent = await trx.select().from(events).where(eq(events.event_uuid, eventUuid!));

          const canUpdateRegistraion = oldEvent[0].has_registration;

          const updatedEvent = await trx
            .update(events)
            .set({
              type: eventData.type,
              title: eventData.title,
              subtitle: eventData.subtitle,
              description: eventData.description,
              image_url: eventData.image_url,
              society_hub: eventData.society_hub.name,
              society_hub_id: eventData.society_hub.id,
              secret_phrase: hashedSecretPhrase,
              start_date: eventData.start_date,
              end_date: eventData.end_date,
              location: eventData.location,
              participationType: eventData.eventLocationType,
              timezone: eventData.timezone,
              countryId: eventData.countryId,
              cityId: eventData.cityId,
              updatedBy: opts.ctx.user.user_id.toString(),
              updatedAt: new Date(),

              /* ------------------------ Event Registration Update ----------------------- */
              // Updating has_registration is not allowed
              has_approval: canUpdateRegistraion ? eventData.has_approval : false,
              capacity: canUpdateRegistraion ? eventData.capacity : null,
              has_waiting_list: canUpdateRegistraion ? eventData.has_waiting_list : false,
              /* ------------------------ Event Registration Update ----------------------- */
            })
            .where(eq(events.event_uuid, eventUuid))
            .returning()
            .execute();

          const currentFields = await eventFieldsDB.selectEventFieldsByEventId(trx, eventId!);

          const fieldsToDelete = currentFields.filter(
            (field) => !eventData.dynamic_fields.some((newField) => newField.id === field.id) && field.title !== "secret_phrase_onton_input"
          );

          for (const field of fieldsToDelete) {
            await eventFieldsDB.deleteEventFieldById(trx, field.id, eventId!);
          }

          const secretPhraseTask = await trx
            .select()
            .from(eventFields)
            .where(and(eq(eventFields.event_id, eventId!), eq(eventFields.title, "secret_phrase_onton_input")))
            .execute();

          if (hashedSecretPhrase || (hashedSecretPhrase === undefined && oldEvent[0].ticketToCheckIn === false)) {
            if (secretPhraseTask.length > 0) {
              // Update the existing secret phrase task
              await eventFieldsDB.updateEventFieldLog(trx, secretPhraseTask[0].id, opts.ctx.user.user_id.toString());
            } else {
              // Insert a new secret phrase task
              await eventFieldsDB.insertEventField(trx, {
                emoji: "🔒",
                title: "secret_phrase_onton_input",
                description: "Enter the event password",
                placeholder: "Enter the event password",
                type: "input",
                order_place: eventData.dynamic_fields.length,
                event_id: eventId,
                updatedBy: opts.ctx.user.user_id.toString(),
              });
            }
          }

          for (const [index, field] of eventData.dynamic_fields.filter((f) => f.title !== "secret_phrase_onton_input").entries()) {
            await eventFieldsDB.upsertEventField(trx, field, index, opts.ctx.user.user_id.toString(), eventId);
          }

          const additional_info = z.string().url().safeParse(eventData).success ? "Online" : opts.input.eventData.location;

          const eventDraft: TonSocietyRegisterActivityT = {
            title: eventData.title,
            subtitle: eventData.subtitle,
            description: eventData.description,
            hub_id: parseInt(eventData.society_hub.id),
            start_date: timestampToIsoString(eventData.start_date),
            end_date: timestampToIsoString(eventData.end_date!),
            additional_info,
            cta_button: {
              link: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}`,
              label: "Enter Event",
            },
          };

          // Remove the description key from updated Event
          const updatedEventWithoutDescription = removeKey(updatedEvent[0], "description");
          // Remove the description key from old Event
          const oldEventWithoutDescription = removeKey(oldEvent[0], "description");

          const oldChanges = getObjectDifference(updatedEventWithoutDescription, oldEventWithoutDescription);

          const updateChanges = getObjectDifference(updatedEventWithoutDescription, oldEventWithoutDescription);

          const message = `
@${opts.ctx.user.username} <b>Updated</b> an event <code>${eventUuid}</code> successfully

Before:
<pre><code>${formatChanges(oldChanges)}</code></pre>

After:
<pre><code>${formatChanges(updateChanges)}</code></pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
`;

          // if it was a fully local setup we don't want to update the activity_id
          if (process.env.ENV !== "local") {
            try {
              await updateActivity(eventDraft, opts.ctx.event.activity_id as number);
            } catch (error) {
              console.log("update_event_ton_society_failed", JSON.stringify(eventDraft));

              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to update ton Society activity_id : ${opts.ctx.event.activity_id}`,
              });
            }
          }

          await sendLogNotification({ message });

          return { success: true, eventId: opts.ctx.event.event_uuid } as const;
        });
      } catch (err) {
        console.log(`[eventRouter]_update_event failed id: ${opts.ctx.event.event_uuid}, error: ${err}`);

        internal_server_error(err, `Failed to update event ${opts.ctx.event.event_uuid}`);
      }
    }),

  // private
  getHubs: publicProcedure.query(async () => {
    try {
      const response = await tonSocietyClient.get<HubsResponse>(`/hubs`, {
        params: {
          _start: 0,
          _end: 100,
        },
      });

      if (response.status === 200 && response.data) {
        const sortedHubs = response.data.data.sort((a, b) => Number(a.id) - Number(b.id));

        const transformedHubs = sortedHubs.map((hub) => ({
          id: hub.id.toString(),
          name: hub.attributes.title,
        }));

        return {
          status: "success",
          hubs: transformedHubs,
        };
      } else {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch data",
        });
      }
    } catch (error) {
      console.error("hub fetch failed", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch data",
      });
    }
  }),
  // private
  requestShareEvent: initDataProtectedProcedure
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
          return { status: "fail", data: "Event not found" };
        }

        const { event_uuid } = event;
        // Step 2: Make the request to share the event
        const result = await telegramService.shareEventRequest(opts.ctx.user.user_id.toString(), event_uuid.toString());

        if (result.success) {
          // console.log("Event shared successfully:", result.data);
          return { status: "success", data: null };
        } else {
          console.error("Failed to share the event:", result.error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to share the event",
            cause: result.error,
          });
        }
      } catch (error) {
        console.error("Error while sharing event: ", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to share the event",
          cause: error,
        });
      }
    }),

  // private
  requestExportFile: eventManagementProtectedProcedure.mutation(async (opts) => {
    const event = opts.ctx.event;
    const dynamic_fields = !(event.has_registration && event.participationType === "in_person");

    const visitors = await selectVisitorsByEventUuid(opts.input.event_uuid, -1, 0, dynamic_fields, "");
    const eventData = await selectEventByUuid(opts.input.event_uuid);

    console.log("====================visitors================== >> ", visitors, opts.input.event_uuid);
    // Map the data and conditionally remove fields

    const dataForCsv = visitors.visitorsWithDynamicFields?.map((visitor) => {
      // Explicitly define wallet_address type and handle other optional fields
      //@ts-ignore
      const visitorData: Partial<VisitorsWithDynamicFields> = {
        ...visitor,
        ticket_status: "ticket_status" in visitor ? (visitor.ticket_status ?? undefined) : undefined,
        wallet_address: visitor.wallet_address as string | null | undefined,
        username: visitor.username === "null" ? null : visitor.username,
      };
      // Copy the visitor object without modifying dynamicFields directly

      // If ticketToCheckIn is false, remove specific fields
      if (!eventData?.ticketToCheckIn && "has_ticket" in visitorData) {
        delete visitorData.has_ticket;
        delete visitorData.ticket_status;
        delete visitorData.ticket_id;
      }

      // Generate a new object for CSV with stringified dynamicFields
      return {
        ...visitorData,
        dynamicFields: JSON.stringify(visitor.dynamicFields),
      };
    });

    const csvString = Papa.unparse(dataForCsv || [], {
      header: true,
    });

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
        customMessage = `📂 Download Guest List Report \n\n🟢 ${eventData?.title} \n\n👤 Count of Guests ${visitors.visitorsWithDynamicFields?.length}`;
      }
      formData.append("message", customMessage);
      formData.append("fileName", eventData?.title || "visitors");
      const userId = opts.ctx.user.user_id;
      const response = await axios.post(`http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/send-file?id=${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.status === 200 ? { status: "success", data: null } : { status: "fail", data: response.data };
    } catch (error) {
      console.error("Error while sending file: ", error);
      return { status: "fail", data: null };
    }
  }),
  // private
  requestSendQRcode: eventManagementProtectedProcedure
    .input(
      z.object({
        url: z.string(),
        hub: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      try {
        const response = await axios.get(`http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/generate-qr`, {
          params: {
            id: opts.ctx.user.user_id,
            url: opts.input.url,
            hub: opts.input.hub,
          },
        });

        return response.status === 200 ? { status: "success", data: null } : { status: "fail", data: response.data };
      } catch (error) {
        console.error("Error while generating QR Code: ", error);
        return { status: "fail", data: null };
      }
    }),
  getEventsWithFilters: publicProcedure.input(searchEventsInputZod).query(async (opts) => {
    try {
      const events = await getEventsWithFilters(opts.input);
      return { status: "success", data: events };
    } catch (error) {
      console.error("Error fetching events:", error);
      return { status: "fail", data: null };
    }
  }),
});
