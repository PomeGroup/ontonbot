import { db } from "@/db/db";
import { eventFields, events, users, visitors } from "@/db/schema";
import { hashPassword } from "@/lib/bcrypt";
import { sendLogNotification } from "@/lib/tgBot";
import {
  CreateActivityRequestBody,
  registerActivity,
  updateActivity,
} from "@/lib/ton-society-api";
import { getObjectDifference, removeKey } from "@/lib/utils";
import { VisitorsWithDynamicFields } from "@/server/db/dynamicType/VisitorsWithDynamicFields";
import {
  EventDataSchema,
  HubsResponse,
  SocietyHub,
  UpdateEventDataSchema,
} from "@/types";
import { TonSocietyRegisterActivityT } from "@/types/event.types";
import { fetchBalance } from "@/utils";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import dotenv from "dotenv";
import { and, desc, eq, isNotNull } from "drizzle-orm";
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
dotenv.config();

export const eventsRouter = router({
  // private
  getVisitorsWithWalletsNumber: eventManagementProtectedProcedure.query(
    async (opts) => {
      return (
        (
          await db
            .select()
            .from(visitors)
            .fullJoin(users, eq(visitors.user_id, users.user_id))
            .where(
              and(
                eq(visitors.event_uuid, opts.input.event_uuid),
                isNotNull(users.wallet_address)
              )
            )
            .execute()
        ).length || 0
      );
    }
  ),

  getWalletBalance: publicProcedure.input(z.string()).query(async (opts) => {
    return await fetchBalance(opts.input);
  }),

  getEvent: initDataProtectedProcedure
    .input(z.object({ event_uuid: z.string() }))
    .query(async (opts) => {
      try {
        const eventVisitor = await db.query.visitors.findFirst({
          where: (fields, { eq, and }) => {
            return and(
              eq(fields.user_id, opts.ctx.user.user_id),
              eq(fields.event_uuid, opts.input.event_uuid)
            );
          },
        });
        if (eventVisitor) {
          await updateVisitorLastVisit(eventVisitor.id);
        }
      } catch (error) {
        console.error("Error at updating visitor", error);
      }

      return selectEventByUuid(opts.input.event_uuid);
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
          const inputSecretPhrase = opts.input.eventData.secret_phrase
            .trim()
            .toLowerCase();

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
              cityId: opts.input.eventData.cityId,
            })
            .returning();

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

          const additional_info = z
            .string()
            .url()
            .safeParse(opts.input.eventData.location).success
            ? "Online"
            : opts.input.eventData.location;

          await sendLogNotification({
            message: `
@${opts.ctx.user.username} <b>Added</b> a new event <code>${newEvent[0].event_uuid}</code> successfully

<pre><code>${formatChanges(newEvent[0])}</code></pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${newEvent[0].event_uuid}
            `,
          });

          const country = await db.query.giataCity.findFirst({
            where: (fields, { eq }) => {
              return eq(fields.id, opts.input.eventData.countryId as number);
            },
          });

          const eventDraft: CreateActivityRequestBody = {
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
            rewards: {
              mint_type: "manual",
              collection: {
                title: opts.input.eventData.title,
                description: opts.input.eventData.description,
                image: {
                  url: opts.input.eventData.image_url,
                },
                cover: {
                  url: opts.input.eventData.image_url,
                },
                item_title: opts.input.eventData.title,
                item_description: "Reward for participation",
                item_image: {
                  url: opts.input.eventData.ts_reward_url,
                },
                item_metadata: {
                  activity_type: "event",
                  place: {
                    type:
                      opts.input.eventData.eventLocationType === "online"
                        ? "Online"
                        : "Offline",
                    // if the type is online, the coordinates will be null
                    country_code_iso: country?.abbreviatedCode,
                    venue_name: opts.input.eventData.location,
                  },
                },
              },
            },
          };
          const res = await registerActivity(eventDraft);

          await trx
            .update(events)
            .set({
              activity_id: res.data.activity_id,
              updatedBy: opts.ctx.user.user_id.toString(),
            })
            .where(eq(events.event_uuid, newEvent[0].event_uuid as string))
            .execute();

          return newEvent;
        });

        return { success: true, eventId: result[0].event_id };
      } catch (error) {
        console.error("Error while adding event: ", error);
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
          .set({ hidden: true }) // Set the 'hidden' field to true
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

          const oldChanges = getObjectDifference(updatedEvent[0], oldEvent[0]);

          const updateChanges = getObjectDifference(
            oldEvent[0],
            updatedEvent[0]
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
