import { db } from "@/db/db";
import { eventFields, events, eventRegistrants, users } from "@/db/schema";
import { fetchCountryById } from "@/server/db/giataCity.db";

import { hashPassword } from "@/lib/bcrypt";
import { sendLogNotification } from "@/lib/tgBot";
import { registerActivity, tonSocietyClient, updateActivity } from "@/lib/ton-society-api";
import { getObjectDifference, removeKey } from "@/lib/utils";
import { VisitorsWithDynamicFields } from "@/server/db/dynamicType/VisitorsWithDynamicFields";
import {
  EventDataSchema,
  HubsResponse,
  SocietyHub,
  UpdateEventDataSchema,
  EventRegisterSchema,
} from "@/types";

import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import dotenv from "dotenv";
import { and, count, desc, eq, ne } from "drizzle-orm";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getEventByUuid, getEventsWithFilters, selectEventByUuid } from "../db/events";
import { selectVisitorsByEventUuid } from "../db/visitors";
import {
  adminOrganizerProtectedProcedure,
  eventManagementProtectedProcedure,
  initDataProtectedProcedure,
  publicProcedure,
  router,
} from "../trpc";
import { TonSocietyRegisterActivityT } from "@/types/event.types";
import eventFieldsDB from "@/server/db/eventFields.db";
import telegramService from "@/server/routers/services/telegramService";

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

const formatChanges = (changes: any) =>
  JSON.stringify(changes ? removeKey(changes, "secret_phrase") : null, null, 2);

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
        .where(and(eq(eventRegistrants.status, "approved"), eq(eventRegistrants.event_uuid, event_uuid)))
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
    const eventData = await selectEventByUuid(event_uuid);
    let capacity_filled = false;
    let registrant_status: "pending" | "rejected" | "approved" | "" = "";
    if (!eventData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "event not found",
      });
    }
    if (!eventData.has_registration) {
      return { capacity_filled, registrant_status, ...eventData };
    }

    /* ------------------------ Event Needs Registration ------------------------ */

    const user_request = await getRegistrantRequest(event_uuid, userId);
    const event_location = eventData.location;

    eventData.location = "Only Visible To Registered Users ";
    if (eventData.capacity && eventData.owner != userId) {
      eventData.capacity = 99;
    }
    if (eventData.owner == userId) {
      eventData.location = event_location;
    }

    // Registrant Already has a request
    if (user_request) {
      registrant_status = user_request.status;
      if (registrant_status == "approved") {
        eventData.location = event_location;
      }
      return { capacity_filled, registrant_status, ...eventData };
    }

    // no status for registran

    if (eventData.capacity) {
      const approved_requests_count = await getApprovedRequestsCount(event_uuid);

      if (approved_requests_count >= eventData.capacity) {
        // Event capacity filled
        capacity_filled = true;
        return { capacity_filled, registrant_status, ...eventData };
      }
    }

    // NO Status
    return { capacity_filled, registrant_status, ...eventData };

    /* -------------------------------------------------------------------------- */
  }),

  // private
  getEvents: adminOrganizerProtectedProcedure.query(async (opts) => {
    let eventsData = [];

    if (opts.ctx.userRole === "admin") {
      eventsData = await db
        .select()
        .from(events)
        .where(eq(events.hidden, false))
        .orderBy(desc(events.created_at))
        .execute();
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

    console.log("event_register", event_uuid, userId);

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

    return { message: "success", code: 201 };
  }),

  /* -------------------------------------------------------------------------- */
  /*                            Get Event Registrant 👨‍👩‍👧                        */
  /* -------------------------------------------------------------------------- */
  getEventRegistrants: eventManagementProtectedProcedure
    .input(z.object({ event_uuid: z.string() }))
    .query(async (opts) => {
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
        .orderBy(desc(eventRegistrants.created_at))
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
        .where(and(eq(eventRegistrants.event_uuid, event_uuid), eq(eventRegistrants.user_id, user_id)))
        .execute();

      return { code: 201, message: "ok" };
    }),

  // private
  addEvent: adminOrganizerProtectedProcedure
    .input(
      z.object({
        eventData: EventDataSchema,
      })
    )
    .mutation(async (opts) => {
      try {
        const result = await db.transaction(async (trx) => {
          const countryId = opts.input.eventData.countryId;
          const country = countryId ? await fetchCountryById(countryId) : undefined;

          const inputSecretPhrase = opts.input.eventData.secret_phrase.trim().toLowerCase();

          const hashedSecretPhrase = Boolean(inputSecretPhrase)
            ? await hashPassword(inputSecretPhrase)
            : undefined;

          if (!hashedSecretPhrase) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid secret phrase",
            });
          }

          const newEvent = await trx
            .insert(events)
            .values({
              type: opts.input.eventData.type,
              event_uuid: uuidv4(),
              title: opts.input.eventData.title,
              subtitle: opts.input.eventData.subtitle,
              description: opts.input.eventData.description,
              image_url: opts.input.eventData.image_url,
              society_hub: opts.input.eventData.society_hub.name,
              society_hub_id: opts.input.eventData.society_hub.id,
              secret_phrase: hashedSecretPhrase,
              start_date: opts.input.eventData.start_date,
              end_date: opts.input.eventData.end_date,
              timezone: opts.input.eventData.timezone,
              location: opts.input.eventData.location,
              owner: opts.ctx.user.user_id,
              participationType: opts.input.eventData.eventLocationType,
              countryId: opts.input.eventData.countryId,
              tsRewardImage: opts.input.eventData.ts_reward_url,
              tsRewardVideo: opts.input.eventData.video_url,
              cityId: opts.input.eventData.cityId,

              //Event Registration
              has_registration: opts.input.eventData.has_registration,
              has_approval: opts.input.eventData.has_approval,
              capacity: opts.input.eventData.capacity,
              has_waiting_list: opts.input.eventData.has_waiting_list,
              //Event Registration
            })
            .returning();

          // Insert dynamic fields
          for (let i = 0; i < opts.input.eventData.dynamic_fields.length; i++) {
            const field = opts.input.eventData.dynamic_fields[i];
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

          // Insert secret phrase field if applicable
          if (inputSecretPhrase) {
            await eventFieldsDB.insertEventField(trx, {
              emoji: "🔒",
              title: "secret_phrase_onton_input",
              description: "Enter the event password",
              placeholder: "Enter the event password",
              type: "input",
              order_place: opts.input.eventData.dynamic_fields.length,
              event_id: newEvent[0].event_id,
              updatedBy: opts.ctx.user.user_id.toString(),
            });
          }

          const additional_info = z.string().url().safeParse(opts.input.eventData.location).success
            ? "Online"
            : opts.input.eventData.location;

          const eventDraft: TonSocietyRegisterActivityT = {
            title: opts.input.eventData.title,
            subtitle: opts.input.eventData.subtitle,
            description: opts.input.eventData.description,
            hub_id: parseInt(opts.input.eventData.society_hub.id),
            start_date: timestampToIsoString(opts.input.eventData.start_date),
            end_date: timestampToIsoString(opts.input.eventData.end_date!),
            additional_info,
            cta_button: {
              link: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${newEvent[0].event_uuid}`,
              label: "Enter Event",
            },
            ...(opts.input.eventData.ts_reward_url
              ? {
                  rewards: {
                    mint_type: "manual",
                    collection: {
                      title: opts.input.eventData.title,
                      description: opts.input.eventData.description,
                      image: {
                        url: process.env.ENV !== "local" ? opts.input.eventData.image_url : PLACEHOLDER_IMAGE,
                      },
                      cover: {
                        url: process.env.ENV !== "local" ? opts.input.eventData.image_url : PLACEHOLDER_IMAGE,
                      },
                      item_title: opts.input.eventData.title,
                      item_description: "Reward for participation",
                      item_image: {
                        url:
                          process.env.ENV !== "local"
                            ? opts.input.eventData.ts_reward_url
                            : PLACEHOLDER_IMAGE,
                      },
                      ...(opts.input.eventData.video_url
                        ? {
                            item_video: {
                              url:
                                process.env.ENV !== "local"
                                  ? new URL(opts.input.eventData.video_url).origin +
                                    new URL(opts.input.eventData.video_url).pathname
                                  : PLACEHOLDER_VIDEO,
                            },
                          }
                        : {}),
                      item_metadata: {
                        activity_type: "event",
                        place: {
                          type: opts.input.eventData.eventLocationType === "online" ? "Online" : "Offline",
                          ...(country && country?.abbreviatedCode
                            ? {
                                country_code_iso: country.abbreviatedCode,
                                venue_name: opts.input.eventData.location,
                              }
                            : {
                                venue_name: opts.input.eventData.location, // Use location regardless of country
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
        console.error(`Error while adding event: ${Date.now()}`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Error while adding event",
        });
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
          const inputSecretPhrase = eventData.secret_phrase
            ? eventData.secret_phrase.trim().toLowerCase()
            : undefined;

          const hashedSecretPhrase = inputSecretPhrase ? await hashPassword(inputSecretPhrase) : undefined;

          const oldEvent = await trx.select().from(events).where(eq(events.event_uuid, eventUuid!));

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
              has_approval: eventData.has_approval,
              capacity: eventData.capacity,
              has_waiting_list: eventData.has_waiting_list,
              /* ------------------------ Event Registration Update ----------------------- */
            })
            .where(eq(events.event_uuid, eventUuid))
            .returning()
            .execute();

          const currentFields = await eventFieldsDB.selectEventFieldsByEventId(trx, eventId!);

          const fieldsToDelete = currentFields.filter(
            (field) =>
              !eventData.dynamic_fields.some((newField) => newField.id === field.id) &&
              field.title !== "secret_phrase_onton_input"
          );

          for (const field of fieldsToDelete) {
            await eventFieldsDB.deleteEventFieldById(trx, field.id, eventId!);
          }

          const secretPhraseTask = await trx
            .select()
            .from(eventFields)
            .where(
              and(eq(eventFields.event_id, eventId!), eq(eventFields.title, "secret_phrase_onton_input"))
            )
            .execute();

          if (
            hashedSecretPhrase ||
            (hashedSecretPhrase === undefined && oldEvent[0].ticketToCheckIn === false)
          ) {
            if (secretPhraseTask.length > 0) {
              // Update the existing secret phrase task
              await eventFieldsDB.updateEventFieldLog(
                trx,
                secretPhraseTask[0].id,
                opts.ctx.user.user_id.toString()
              );
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

          for (const [index, field] of eventData.dynamic_fields
            .filter((f) => f.title !== "secret_phrase_onton_input")
            .entries()) {
            await eventFieldsDB.upsertEventField(
              trx,
              field,
              index,
              opts.ctx.user.user_id.toString(),
              eventId
            );
          }

          const additional_info = z.string().url().safeParse(eventData).success
            ? "Online"
            : opts.input.eventData.location;

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

          const updateChanges = getObjectDifference(
            updatedEventWithoutDescription,
            oldEventWithoutDescription
          );

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
            await updateActivity(eventDraft, opts.ctx.event.activity_id as number);
          }

          await sendLogNotification({ message });

          return { success: true, eventId: opts.ctx.event.event_uuid } as const;
        });
      } catch (err) {
        console.error(`[eventRouter] update event failed id: ${opts.ctx.event.event_uuid}, error: `, err);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update event ${opts.ctx.event.event_uuid}`,
        });
      }
    }),

  // private
  getHubs: publicProcedure.query(
    async (): Promise<{ status: "success"; hubs: SocietyHub[] } | { status: "error"; message: string }> => {
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
          } as const;
        } else {
          return {
            status: "error",
            message: "Failed to fetch data",
          } as const;
        }
      } catch (error) {
        console.error("hub fetch failed", error);

        return {
          status: "error",
          message: "Internal server error",
        } as const;
      }
    }
  ),
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
        const result = await telegramService.shareEventRequest(
          opts.ctx.user.user_id.toString(),
          event_uuid.toString()
        );

        if (result.success) {
          console.log("Event shared successfully:", result.data);
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
    const visitors = await selectVisitorsByEventUuid(opts.input.event_uuid, -1, 0, true, "");
    const eventData = await selectEventByUuid(opts.input.event_uuid);
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

    console.log("dataForCsv:  ", dataForCsv);

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
      const response = await axios.post(
        `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/send-file?id=${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.status === 200
        ? { status: "success", data: null }
        : { status: "fail", data: response.data };
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

        return response.status === 200
          ? { status: "success", data: null }
          : { status: "fail", data: response.data };
      } catch (error) {
        console.error("Error while generating QR Code: ", error);
        return { status: "fail", data: null };
      }
    }),
  getEventsWithFilters: publicProcedure.input(searchEventsInputZod).query(async (opts) => {
    // console.log("*****config", config, configProtected);
    try {
      const events = await getEventsWithFilters(opts.input);
      return { status: "success", data: events };
    } catch (error) {
      console.error("Error fetching events:", error);
      return { status: "fail", data: null };
    }
  }),
});
