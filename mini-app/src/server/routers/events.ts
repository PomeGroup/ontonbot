import { db } from "@/db/db";
import { eventFields, events } from "@/db/schema";
import { fetchCountryById } from "@/server/db/giataCity.db";
import {
  findVisitorByUserAndEventUuid,
  selectVisitorsWithWalletAddress,
} from "@/server/db/visitors";
import { hashPassword } from "@/lib/bcrypt";
import { sendLogNotification } from "@/lib/tgBot";
import { registerActivity, updateActivity } from "@/lib/ton-society-api";
import { getObjectDifference, removeKey } from "@/lib/utils";
import { VisitorsWithDynamicFields } from "@/server/db/dynamicType/VisitorsWithDynamicFields";
import {
  EventDataSchema,
  HubsResponse,
  SocietyHub,
  UpdateEventDataSchema,
} from "@/types";

import { fetchBalance } from "@/utils";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import dotenv from "dotenv";
import { and, desc, eq } from "drizzle-orm";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getEventsWithFilters, selectEventByUuid } from "../db/events";
import {
  selectVisitorsByEventUuid,
  updateVisitorLastVisit,
} from "../db/visitors";
import {
  adminOrganizerProtectedProcedure,
  eventManagementProtectedProcedure,
  initDataProtectedProcedure,
  publicProcedure,
  router,
} from "../trpc";
import { TonSocietyRegisterActivityT } from "@/types/event.types";
import { getErrorMessages } from "@/lib/error";

dotenv.config();

export const eventsRouter = router({
  // private
  getVisitorsWithWalletsNumber: eventManagementProtectedProcedure.query(
    async (opts) => {
      return (
        (await selectVisitorsWithWalletAddress(opts.ctx.event.event_uuid))
          .length || 0
      );
    }
  ),

  getWalletBalance: publicProcedure.input(z.string()).query(async (opts) => {
    return await fetchBalance(opts.input);
  }),

  getEvent: initDataProtectedProcedure
    .input(z.object({ event_uuid: z.string() }))
    .output(
      z
        .object({
          type: z.number().nullable(),
          event_uuid: z.string(),
          event_id: z.number(),
          title: z.string().nullable(),
          subtitle: z.string().nullable(),
          description: z.string().nullable(),
          image_url: z.string().nullable(),
          tsRewardImage: z.string().nullable(),
          society_hub: z
            .object({
              id: z.union([z.string(), z.number(), z.null()]),
              name: z.string().nullable(),
            })
            .nullable(),
        })
        .nullable()
    )
    .query(async (opts) => {
      try {
        const eventVisitor = await findVisitorByUserAndEventUuid(
          opts.ctx.user.user_id,
          opts.input.event_uuid
        );
        if (eventVisitor) {
          await updateVisitorLastVisit(eventVisitor.id);
        }
      } catch (error) {
        console.error("Error at updating visitor", error);
      }

      try {
        const event = await selectEventByUuid(
          opts.input.event_uuid,
          opts.ctx.user.user_id
        );

        // Handle `society_hub`: If `society_hub` is null, default it to an empty object
        if (event?.society_hub === null) {
          event.society_hub = { id: null, name: null }; // Ensure both `id` and `name` are nullable
        }

        return event || null;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        const messages = getErrorMessages(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
          message: messages?.join(", "),
        });
      }
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
        .where(
          and(eq(events.hidden, false), eq(events.owner, opts.ctx.user.user_id))
        )
        .orderBy(desc(events.created_at))
        .execute();
    } else {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized access, invalid role",
      });
    }

    return eventsData.map(
      ({ wallet_seed_phrase, ...restEventData }) => restEventData
    );
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
          const country = countryId
            ? await fetchCountryById(countryId)
            : undefined;

          // Secret phrase handling with optional chaining and fallback
          const inputSecretPhrase = opts.input.eventData.secret_phrase
            ? opts.input.eventData.secret_phrase.trim().toLowerCase()
            : undefined;

          const hashedSecretPhrase = inputSecretPhrase
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
              type: opts.input.eventData.type || null,
              event_uuid: uuidv4(),
              title: opts.input.eventData.title || "Untitled Event",
              subtitle: opts.input.eventData.subtitle || "",
              description: opts.input.eventData.description || "",
              image_url: opts.input.eventData.image_url || "",

              society_hub: opts.input.eventData.society_hub?.name || "",
              society_hub_id: opts.input.eventData.society_hub?.id || null,

              secret_phrase: hashedSecretPhrase,

              start_date: opts.input.eventData.start_date,
              end_date: opts.input.eventData.end_date || null,
              timezone: opts.input.eventData.timezone || "UTC",
              location: opts.input.eventData.location || "Unknown Location",
              owner: opts.ctx.user.user_id,
              participationType:
                opts.input.eventData.eventLocationType || "online",
              countryId: opts.input.eventData.countryId || null,
              tsRewardImage: opts.input.eventData.ts_reward_url || null,
              cityId: opts.input.eventData.cityId || null,
            })
            .returning();

          // Insert dynamic fields related to the event
          for (let i = 0; i < opts.input.eventData.dynamic_fields.length; i++) {
            const field = opts.input.eventData.dynamic_fields[i];
            await trx.insert(eventFields).values({
              emoji: field.emoji,
              title: field.title,
              description: field.description,
              placeholder:
                field.type === "button" ? field.url : field.placeholder,
              type: field.type,
              order_place: i,
              event_id: newEvent[0].event_id,
              updatedBy: opts.ctx.user.user_id.toString(),
            });
          }

          // Handle inserting the secret phrase field, if it exists
          if (inputSecretPhrase) {
            await trx
              .insert(eventFields)
              .values({
                emoji: "🔒",
                title: "secret_phrase_onton_input",
                description: "Enter the event password",
                placeholder: "Enter the event password",
                type: "input",
                order_place: opts.input.eventData.dynamic_fields.length,
                event_id: newEvent[0].event_id,
                updatedBy: opts.ctx.user.user_id.toString(),
              })
              .execute();
          }

          // Additional info for online/offline event handling
          const additional_info = z
            .string()
            .url()
            .safeParse(opts.input.eventData.location).success
            ? "Online"
            : opts.input.eventData.location;

          // Prepare event draft for TonSociety API
          const eventDraft: TonSocietyRegisterActivityT = {
            title: opts.input.eventData.title || "Untitled Event",
            subtitle: opts.input.eventData.subtitle || "",
            description: opts.input.eventData.description || "",
            hub_id: parseInt(opts.input.eventData.society_hub?.id || "0", 10), // Use 0 if no id provided
            start_date: timestampToIsoString(opts.input.eventData.start_date),
            end_date: timestampToIsoString(
              opts.input.eventData.end_date || Math.floor(Date.now() / 1000)
            ), // Default end date
            additional_info,
            cta_button: {
              link: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${newEvent[0].event_uuid}`,
              label: "Enter Event",
            },
            rewards: {
              mint_type: "manual",
              collection: {
                title: opts.input.eventData.title || "Event Reward",
                description: opts.input.eventData.description || "",
                image: {
                  url: opts.input.eventData.image_url || "",
                },
                cover: {
                  url: opts.input.eventData.image_url || "",
                },
                item_title: opts.input.eventData.title || "Reward",
                item_description: "Reward for participation",
                item_image: {
                  url: opts.input.eventData.ts_reward_url || "",
                },
                item_metadata: {
                  activity_type: "event",
                  place: {
                    type:
                      opts.input.eventData.eventLocationType === "online"
                        ? "Online"
                        : "Offline",
                    venue_name:
                      opts.input.eventData.location || "Unknown Location",
                    ...(country && {
                      country_code_iso: country.abbreviatedCode, // Add country_code_iso only if country exists
                    }),
                  },
                },
              },
            },
          };

          console.log(eventDraft);

          // Register activity with the TonSociety API
          const res = await registerActivity(eventDraft);

          // Update the event with the activity_id
          await trx
            .update(events)
            .set({
              activity_id: res.data.activity_id,
              updatedBy: opts.ctx.user.user_id.toString(),
              updatedAt: new Date(),
            })
            .where(eq(events.event_uuid, newEvent[0].event_uuid))
            .execute();

          return newEvent;
        });

        return {
          success: true,
          eventId: result[0].event_id,
          eventHash: result[0].event_uuid,
        };
      } catch (error) {
        console.error(`Error while adding event: ${Date.now()}`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Error while adding event",
        });
      }
    }),

  // private
  deleteEvent: eventManagementProtectedProcedure.mutation(async (opts) => {
    try {
      return await db.transaction(async (trx) => {
        const deletedEvent = await trx
          .update(events)
          .set({
            hidden: true,
            updatedBy: "system-delete",
            updatedAt: new Date(),
          }) // Set the 'hidden' field to true
          .where(eq(events.event_uuid, opts.input.event_uuid))
          .returning();

        await sendLogNotification({
          message: `
@${opts.ctx.user.username} <b>Deleted</b> an event <code>${deletedEvent[0].event_uuid}</code>.

<pre><code>${JSON.stringify(deletedEvent[0], null, 2)}</code></pre>
`,
        });

        return { success: true };
      });
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  }),

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

          const hashedSecretPhrase = inputSecretPhrase
            ? await hashPassword(inputSecretPhrase)
            : undefined;

          const oldEvent = await trx
            .select()
            .from(events)
            .where(eq(events.event_uuid, eventUuid!));

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
            })
            .where(eq(events.event_uuid, eventUuid))
            .returning()
            .execute();

          const currentFields = await trx
            .select()
            .from(eventFields)
            .where(eq(eventFields.event_id, eventId!))
            .execute();

          const fieldsToDelete = currentFields.filter(
            (field) =>
              !eventData.dynamic_fields.some(
                (newField) => newField.id === field.id
              )
          );

          for (const field of fieldsToDelete) {
            await trx
              .delete(eventFields)
              .where(eq(eventFields.id, field.id))
              .execute();
          }

          const secretPhraseTask = await trx
            .select()
            .from(eventFields)
            .where(
              and(
                eq(eventFields.event_id, eventId!),
                eq(eventFields.title, "secret_phrase_onton_input")
              )
            )
            .execute();

          if (hashedSecretPhrase) {
            if (secretPhraseTask.length) {
              await trx
                .update(eventFields)
                .set({
                  updatedBy: opts.ctx.user.user_id.toString(),
                  updatedAt: new Date(),
                })
                .where(eq(eventFields.id, secretPhraseTask[0].id))
                .execute();
            } else {
              await trx
                .insert(eventFields)
                .values({
                  emoji: "🔒",
                  title: "secret_phrase_onton_input",
                  description: "Enter the event password",
                  placeholder: "Enter the event password",
                  type: "input",
                  order_place: eventData.dynamic_fields.length,
                  event_id: eventId,
                  updatedAt: new Date(),
                })
                .execute();
            }
          }

          for (const [index, field] of eventData.dynamic_fields
            .filter((f) => f.title !== "secret_phrase_onton_input")
            .entries()) {
            if (field.id) {
              await trx
                .update(eventFields)
                .set({
                  emoji: field.emoji,
                  title: field.title,
                  description: field.description,
                  placeholder:
                    field.type === "button" ? field.url : field.placeholder,
                  type: field.type,
                  order_place: index,
                  updatedBy: opts.ctx.user.user_id.toString(),
                  updatedAt: new Date(),
                })
                .where(eq(eventFields.id, field.id))
                .execute();
            } else {
              await trx
                .insert(eventFields)
                .values({
                  emoji: field.emoji,
                  title: field.title,
                  description: field.description,
                  placeholder:
                    field.type === "button" ? field.url : field.placeholder,
                  type: field.type,
                  order_place: index,
                  event_id: eventId,
                })
                .execute();
            }
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
          // Remove the description key from updatedEvent
          const {
            description: updatedDescription,
            ...updatedEventWithoutDescription
          } = updatedEvent[0];
          // Remove the description key from oldEvent
          const { description: oldDescription, ...oldEventWithoutDescription } =
            oldEvent[0];
          const oldChanges = getObjectDifference(
            updatedEventWithoutDescription,
            oldEventWithoutDescription
          );

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

          await updateActivity(
            eventDraft,
            opts.ctx.event.activity_id as number
          );
          await sendLogNotification({ message });

          return { success: true, eventId: opts.ctx.event.event_uuid } as const;
        });
      } catch (err) {
        console.info(`event id: ${opts.ctx.event.event_uuid}, error: `, err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update event ${opts.ctx.event.event_uuid}`,
        });
      }
    }),

  // private
  getHubs: publicProcedure.query(
    async (): Promise<
      | { status: "success"; hubs: SocietyHub[] }
      | { status: "error"; message: string }
    > => {
      try {
        const response = await axios.get<HubsResponse>(
          `${process.env.TON_SOCIETY_BASE_URL}/hubs`,
          {
            params: {
              _start: 0,
              _end: 100,
            },
          }
        );

        if (response.status === 200 && response.data) {
          const sortedHubs = response.data.data.sort(
            (a, b) => Number(a.id) - Number(b.id)
          );

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
        console.error(error);

        return {
          status: "error",
          message: "Internal server error",
        } as const;
      }
    }
  ),

  // private
  requestExportFile: eventManagementProtectedProcedure.mutation(
    async (opts) => {
      const visitors = await selectVisitorsByEventUuid(opts.input.event_uuid);
      const eventData = await selectEventByUuid(opts.input.event_uuid);
      // Map the data and conditionally remove fields
      const dataForCsv = visitors.visitorsWithDynamicFields?.map((visitor) => {
        // Copy the visitor object without modifying dynamicFields directly
        const visitorData: Partial<VisitorsWithDynamicFields> = { ...visitor };

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
          `http://telegram-bot:3333/send-file?id=${userId}`,
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
    }
  ),
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
          "http://telegram-bot:3333/generate-qr",
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
  getEventsWithFilters: publicProcedure
    .input(searchEventsInputZod)
    .query(async (opts) => {
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

function timestampToIsoString(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return date.toISOString();
}

const formatChanges = (changes: any) =>
  JSON.stringify(changes ? removeKey(changes, "secret_phrase") : null, null, 2);
