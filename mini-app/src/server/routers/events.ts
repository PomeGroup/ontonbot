import { db } from "@/db/db";
import {
  eventFields,
  events,
  userEventFields,
  users,
  visitors,
} from "@/db/schema";
import { hashPassword } from "@/lib/bcrypt";
import { sendLogNotification } from "@/lib/tgBot";
import { registerActivity, updateActivity } from "@/lib/ton-society-api";
import { getObjectDifference } from "@/lib/utils";
import { EventDataSchema, HubsResponse, SocietyHub } from "@/types";
import { TonSocietyRegisterActivityT } from "@/types/event.types";
import { fetchBalance, sleep, validateMiniAppData } from "@/utils";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import dotenv from "dotenv";
import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import Papa from "papaparse";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import { Client } from "twitter-api-sdk";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  checkIsAdminOrOrganizer,
  checkIsEventOwner,
  selectEventByUuid,
} from "../db/events";
import {
  selectVisitorsByEventUuid,
  updateVisitorLastVisit,
} from "../db/visitors";
import { initDataProtectedProcedure, publicProcedure, router } from "../trpc";
dotenv.config();

export const eventsRouter = router({
  // private
  getVisitorsWithWalletsNumber: publicProcedure
    .input(
      z.object({
        event_uuid: z.string(),
        initData: z.string().optional(),
      })
    )
    .query(async (opts) => {
      if (!opts.input.initData) {
        return undefined;
      }

      const { valid, role } = await checkIsAdminOrOrganizer(
        opts.input.initData
      );

      if (!valid) {
        throw new Error("Unauthorized access or invalid role");
      }

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
    }),

  getWalletBalance: publicProcedure.input(z.string()).query(async (opts) => {
    const balance = await fetchBalance(opts.input);
    return balance;
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
  getEvents: publicProcedure
    .input(
      z.object({
        initData: z.string().optional(),
      })
    )
    .query(async (opts) => {
      if (!opts.input.initData) {
        return undefined;
      }

      const { valid, role, initDataJson } = await checkIsAdminOrOrganizer(
        opts.input.initData
      );

      if (!valid) {
        throw new Error("Unauthorized access or invalid role");
      }

      let eventsData = [];

      if (role === "admin") {
        eventsData = await db
          .select()
          .from(events)
          .where(eq(events.hidden, false))
          .orderBy(desc(events.created_at))
          .execute();
      } else if (role === "organizer") {
        eventsData = await db
          .select()
          .from(events)
          .where(
            and(
              eq(events.hidden, false),
              eq(events.owner, initDataJson.user.id)
            )
          )
          .orderBy(desc(events.created_at))
          .execute();
      } else {
        throw new Error("Unauthorized access or invalid role");
      }

      const filteredEventsData = eventsData.map(
        ({ wallet_seed_phrase, ...restEventData }) => restEventData
      );

      return filteredEventsData;
    }),

  // private
  addEvent: publicProcedure
    .input(
      z.object({
        eventData: EventDataSchema,
        initData: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      if (!opts.input.initData) {
        return undefined;
      }

      const { valid, initDataJson } = await checkIsAdminOrOrganizer(
        opts.input.initData
      );

      if (!valid) {
        throw new TRPCError({
          message: "Unauthorized access or invalid role",
          code: "FORBIDDEN",
        });
      }
      try {
        let highloadWallet: HighloadWalletResponse =
          {} as HighloadWalletResponse;

        try {
          highloadWallet = await fetchHighloadWallet();
        } catch (error) {
          console.error("Error fetching highload wallet:", error);
          return { success: false };
        }

        const result = await db.transaction(async (trx) => {
          const inputSecretPhrase = opts.input.eventData.secret_phrase
            .trim()
            .toLowerCase();

          const hashedSecretPhrase = Boolean(inputSecretPhrase)
            ? await hashPassword(inputSecretPhrase)
            : undefined;

          const newEvent = await trx
            .insert(events)
            .values({
              type: opts.input.eventData.type,
              event_uuid: uuidv4(),
              title: opts.input.eventData.title,
              subtitle: opts.input.eventData.subtitle,
              description: opts.input.eventData.description,
              image_url: opts.input.eventData.image_url,
              wallet_address: highloadWallet.wallet_address,
              wallet_seed_phrase: highloadWallet.seed_phrase,
              society_hub: opts.input.eventData.society_hub.name,
              society_hub_id: opts.input.eventData.society_hub.id,
              secret_phrase: hashedSecretPhrase,
              start_date: opts.input.eventData.start_date,
              end_date: opts.input.eventData.end_date,
              timezone: opts.input.eventData.timezone,
              location: opts.input.eventData.location,
              owner: initDataJson.user.id,
              updatedBy: initDataJson.user.id.toString(),
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
              updatedBy: initDataJson.user.id.toString(),
            });
          }

          if (inputSecretPhrase) {
            await trx.insert(eventFields).values({
              emoji: "🔒",
              title: "secret_phrase_onton_input",
              description: "Enter the event password",
              placeholder: hashedSecretPhrase,
              type: "input",
              order_place: opts.input.eventData.dynamic_fields.length,
              event_id: newEvent[0].event_id,
              updatedBy: initDataJson.user.id.toString(),
            });
          }

          const additional_info = z
            .string()
            .url()
            .safeParse(opts.input.eventData.location).success
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
          };

          const res = await registerActivity(eventDraft);
          await sendLogNotification({
            message: `
@${initDataJson.user.username} <b>Added</b> a new event <code>${newEvent[0].event_uuid}</code> successfully

<pre>
<code>
${JSON.stringify(newEvent[0], null, 2)}
</code>
</pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${newEvent[0].event_uuid}
            `,
          });

          await trx
            .update(events)
            .set({
              activity_id: res.data.activity_id,
              updatedBy: initDataJson.user.id.toString(),
            })
            .where(eq(events.event_uuid, newEvent[0].event_uuid as string))
            .execute();

          return newEvent;
        });

        return { success: true, eventId: result[0].event_id };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(
            "Error during API call:",
            error.message,
            error.response?.data
          );
        } else {
          console.error("Unexpected error:", error);
        }
        return { success: false };
      }
    }),

  // private
  deleteEvent: publicProcedure
    .input(
      z.object({
        event_uuid: z.string(),
        initData: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      if (!opts.input.initData) {
        return undefined;
      }

      const { valid, initDataJson } = await checkIsEventOwner(
        opts.input.initData,
        opts.input.event_uuid
      );

      if (!valid) {
        throw new Error("Unauthorized access or invalid role");
      }

      try {
        const result = await db.transaction(async (trx) => {
          const deletedEvent = await trx
            .update(events)
            .set({ hidden: true, updatedBy: opts.input.initData }) // Set the 'hidden' field to true
            .where(eq(events.event_uuid, opts.input.event_uuid))
            .returning();

          await sendLogNotification({
            message: `
@${initDataJson.user.username} <b>Deleted</b> an event <code>${deletedEvent[0].event_uuid}</code>.

<pre>
<code>
${JSON.stringify(deletedEvent[0], null, 2)}
</code>
</pre>
`,
          });

          return { success: true };
        });

        return result;
      } catch (error) {
        console.error(error);
        return { success: false };
      }
    }),

  // private
  withdraw: publicProcedure
    .input(
      z.object({
        event_uuid: z.string(),
        initData: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      if (!opts.input.initData) {
        return undefined;
      }

      const { valid } = await checkIsEventOwner(
        opts.input.initData,
        opts.input.event_uuid
      );

      if (!valid) {
        throw new Error("Unauthorized access or invalid role");
      }

      const eventOwner = await db
        .select()
        .from(events)
        .leftJoin(users, eq(events.owner, users.user_id))
        .where(and(eq(events.event_uuid, opts.input.event_uuid)))
        .execute();

      if (
        eventOwner.length === 0 ||
        eventOwner[0].events.wallet_seed_phrase === null ||
        eventOwner[0].users?.wallet_address === null ||
        eventOwner[0].users === null
      ) {
        return;
      }

      await withdrawRequest(
        eventOwner[0].events.wallet_seed_phrase,
        eventOwner[0].users.wallet_address
      );
    }),

  // private
  distribute: publicProcedure
    .input(
      z.object({
        event_uuid: z.string(),
        amount: z.string(),
        initData: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      // select all visitors and which does not have claimed reward
      if (!opts.input.initData) {
        return undefined;
      }

      const { valid } = await checkIsEventOwner(
        opts.input.initData,
        opts.input.event_uuid
      );

      if (!valid) {
        throw new Error("Unauthorized access or invalid role");
      }

      const event = (
        await db
          .select()
          .from(events)
          .where(and(eq(events.event_uuid, opts.input.event_uuid)))
          .execute()
      ).pop();

      // let eligibleUserIds = new Set();
      // if (event?.event_id && await hasTwitterTask(event.event_id)) {
      //     const twitterHandle = await getTwitterHandle(event.event_id);
      //     if (twitterHandle) {
      //         const subscribedUsers = await getSubscribedUsers(twitterHandle, event.event_id);
      //         console.log({ subscribedUsers })
      //         eligibleUserIds = new Set(subscribedUsers.map(user => user.user_id));
      //         console.log({ eligibleUserIds })
      //     }
      // }

      const eventVisitors = await db
        .select()
        .from(visitors)
        .fullJoin(users, eq(visitors.user_id, users.user_id))
        .where(
          and(
            eq(visitors.event_uuid, opts.input.event_uuid),
            isNotNull(users.wallet_address)
          )
        )
        .execute();

      if (
        eventVisitors.length === 0 ||
        event?.wallet_seed_phrase === null ||
        event?.wallet_seed_phrase === undefined ||
        eventVisitors[0].users?.wallet_address === null
      ) {
        return;
      }

      const balance = await fetchBalance(event?.wallet_address!);

      const perUser =
        Number.parseFloat(opts.input.amount) ||
        balance / eventVisitors.length - 0.02;

      const receivers: HighloadWalletTransaction = {
        receivers: {},
      };

      // Filter visitors against the eligible users and prepare the distribution
      eventVisitors.forEach((visitor) => {
        if (
          visitor.users !== null &&
          visitor.users.wallet_address !==
            null /* && eligibleUserIds.has(visitor.users.user_id) */
        ) {
          receivers.receivers[visitor.users.wallet_address!.toString()] =
            perUser.toFixed(2);
        }
      });

      await distributionRequest(event?.wallet_seed_phrase, receivers);
    }),

  // private
  updateEvent: publicProcedure
    .input(
      z.object({
        initData: z.string().optional(),
        eventData: EventDataSchema,
      })
    )
    .mutation(async (opts) => {
      if (!opts.input.initData || !opts.input.eventData.event_uuid) {
        return undefined;
      }

      const { valid, initDataJson } = await checkIsEventOwner(
        opts.input.initData,
        opts.input.eventData.event_uuid
      );

      if (!valid) {
        throw new Error("Unauthorized access or invalid role");
      }

      const eventData = opts.input.eventData;

      if (typeof eventData.event_uuid === "undefined") {
        console.error("event_uuid is undefined");
        return { success: false, message: "event_uuid is required" };
      }

      try {
        return await db.transaction(async (trx) => {
          const inputSecretPhrase = eventData.secret_phrase
            .trim()
            .toLowerCase();

          const hashedSecretPhrase = Boolean(inputSecretPhrase)
            ? await hashPassword(inputSecretPhrase)
            : undefined;

          const oldEvent = await trx
            .select()
            .from(events)
            .where(eq(events.event_uuid, eventData.event_uuid!))
            .execute();

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
              timezone: eventData.timezone,
              updatedBy: initDataJson.user.id.toString(),
            })
            .where(eq(events.event_uuid, eventData.event_uuid!))
            .returning();

          const currentFields = await trx
            .select()
            .from(eventFields)
            .where(eq(eventFields.event_id, eventData.event_id!))
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
                eq(eventFields.event_id, eventData.event_id!),
                eq(eventFields.title, "secret_phrase_onton_input")
              )
            )
            .execute();

          console.log({ secretPhraseTask, eventData, hashedSecretPhrase });

          if (hashedSecretPhrase) {
            if (secretPhraseTask.length) {
              console.log("Updating secret phrase task");

              await trx
                .update(eventFields)
                .set({
                  placeholder: hashedSecretPhrase,
                  updatedBy: initDataJson.user.id.toString(),
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
                  placeholder: hashedSecretPhrase,
                  type: "input",
                  order_place: eventData.dynamic_fields.length,
                  event_id: eventData.event_id,
                  updatedBy: initDataJson.user.id.toString(),
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
                  updatedBy: initDataJson.user.id.toString(),
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
                  event_id: eventData.event_id,
                  updatedBy: initDataJson.user.id.toString(),
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
              link: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventData.event_uuid}`,
              label: "Enter Event",
            },
          };

          const updateChanges = getObjectDifference(
            oldEvent[0],
            updatedEvent[0]
          );

          await sendLogNotification({
            message: `
@${initDataJson.user.username} <b>Updated</b> an event <code>${updatedEvent[0].event_uuid}</code> successfully

<pre>
<code>
${JSON.stringify(updateChanges, null, 2)}
</code>
</pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${updatedEvent[0].event_uuid}
            `,
          });

          await updateActivity(eventDraft, eventData.activity_id as number);

          return { success: true, eventId: eventData.event_id };
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(
            "Error during API call:",
            error.message,
            error.request,
            error.response?.data.error
          );
          return {
            success: false,
            message: "API call error: " + error.message,
          };
        } else {
          console.error("Unexpected error:", error);
          return {
            success: false,
            message: "Unexpected error: " + error,
          };
        }
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
  requestExportFile: publicProcedure
    .input(
      z.object({
        event_uuid: z.string(),
        initData: z.string(),
      })
    )
    .mutation(async (opts) => {
      const visitors = await selectVisitorsByEventUuid(opts.input.event_uuid);
      const validationResult = validateMiniAppData(opts.input.initData);

      if (!validationResult.valid) {
        return { status: "fail", data: null };
      }

      const dataForCsv = visitors.visitorsWithDynamicFields?.map((visitor) => ({
        ...visitor,
        dynamicFields: JSON.stringify(visitor.dynamicFields),
      }));

      const csvString = Papa.unparse(dataForCsv || [], {
        header: true,
      });

      try {
        const formData = new FormData();

        const fileBlob = new Blob([csvString], { type: "text/csv" });
        formData.append("file", fileBlob, "visitors.csv");

        const userId = validationResult.initDataJson?.user?.id;
        const response = await axios.post(
          `http://telegram-bot:3333/send-file?id=${userId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 200) {
          return { status: "success", data: null };
        } else {
          return { status: "fail", data: response.data };
        }
      } catch (error) {
        console.error("Error while sending file: ", error);
        return { status: "fail", data: null };
      }
    }),
  // private
  requestSendQRcode: publicProcedure
    .input(
      z.object({
        url: z.string(),
        initData: z.string(),
        hub: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      const validationResult = validateMiniAppData(opts.input.initData);

      if (!validationResult.valid) {
        return { status: "fail", data: null };
      }

      try {
        const response = await axios.get(
          "http://telegram-bot:3333/generate-qr",
          {
            params: {
              id: validationResult.initDataJson?.user?.id,
              url: opts.input.url,
              hub: opts.input.hub,
            },
          }
        );

        if (response.status === 200) {
          return { status: "success", data: null };
        } else {
          return { status: "fail", data: response.data };
        }
      } catch (error) {
        console.error("Error while generating QR Code: ", error);
        return { status: "fail", data: null };
      }
    }),
});

const getUsersTwitters = async (eventId: number) => {
  const userAnswers = await db
    .select({
      user_id: userEventFields.user_id,
      data: userEventFields.data,
    })
    .from(userEventFields)
    .innerJoin(eventFields, eq(userEventFields.event_field_id, eventFields.id))
    // Assuming there's a direct or indirect relationship you can use to join `events`
    .innerJoin(events, eq(events.event_id, eventFields.event_id)) // Adjust the join condition based on your schema
    .where(
      and(
        eq(events.event_id, eventId), // Now `events` is properly joined
        or(
          sql`lower(${eventFields.title}) = 'twitter'`,
          sql`lower(${eventFields.title}) = 'x'`
        ),
        isNotNull(userEventFields.data)
      )
    )
    .execute();

  return userAnswers || [];
};

const fetchTwitterFollowers = async (twitterHandle: string) => {
  console.log({ twitterHandle });
  try {
    const twitterClient = new Client(process.env.TWITTER_BEARER_TOKEN || "");
    const twitterAccount =
      await twitterClient.users.findUserByUsername(twitterHandle);
    if (twitterAccount.errors && twitterAccount.errors?.length !== 0) {
      console.log(twitterAccount.errors);
      console.error(
        `Failed fetching Twitter account ${twitterHandle}. Reasons: \n${twitterAccount.errors?.join(
          "\n"
        )}`
      );
      return [];
    }

    if (!twitterAccount.data) {
      console.error(
        `Failed fetching Twitter account ${twitterHandle}. No data returned`
      );
      return [];
    }

    const twitterId = twitterAccount.data.id;
    const totalFollowers = [];
    let fetchedCount = 0;
    let nextToken = undefined;
    let requestCount = 0;

    do {
      if (requestCount >= 299) {
        // Wait before making the 300th request
        console.log("Rate limit approached, pausing for 15 minutes...");
        await sleep(900000); // 15 minutes in milliseconds
        requestCount = 0; // Reset request count after waiting
      }

      const followersResponse = await twitterClient.users.usersIdFollowers(
        twitterId,
        {
          max_results: 1000,
          pagination_token: nextToken,
        }
      );

      requestCount++; // Increment request count after each successful request

      if (followersResponse.errors?.length !== 0) {
        console.error(
          `Failed fetching Twitter followers for ${twitterHandle}. Reasons: \n${followersResponse.errors?.join(
            "\n"
          )}`
        );
        return [];
      }

      if (!followersResponse.data) {
        console.error(
          `Failed fetching Twitter followers for ${twitterHandle}. No data returned`
        );
        return [];
      }

      totalFollowers.push(...followersResponse.data);
      nextToken = followersResponse.meta?.next_token;
      fetchedCount = followersResponse.data.length;

      // Adding a short delay before the next request to avoid hitting rate limit
      await sleep(3000); // Wait for 3 seconds before making the next request
    } while (fetchedCount === 1000);

    return totalFollowers;
  } catch (error) {
    console.error("Failed fetching Twitter followers. Reason: ", error);
    return [];
  }
};

const getSubscribedUsers = async (twitterHandle: string, eventId: number) => {
  // Step 1: Fetch users' Twitter handles for the event
  const userAnswers = await getUsersTwitters(eventId);

  // Step 2: Fetch Twitter followers of the given handle
  const followers = await fetchTwitterFollowers(twitterHandle);

  // Convert follower usernames to a set for efficient lookup
  const followerHandlesSet = new Set(
    followers.map((follower) => follower.username.toLowerCase())
  );

  // Step 3: Filter to find users who are followers of the given Twitter handle
  // Now actually using a Set for efficient lookup
  const subscribedUsers = userAnswers.filter((user) =>
    // @ts-expect-error TS sucks here. Not null check is done in the getter function
    followerHandlesSet.has(user.data.toLowerCase())
  );

  return subscribedUsers;
};

const hasTwitterTask = async (eventId: number) => {
  const eventFieldsData = await db
    .select({
      type: eventFields.type,
      title: eventFields.title,
      description: eventFields.description,
    })
    .from(eventFields)
    .where(eq(eventFields.event_id, eventId))
    .execute();

  const hasInputField = eventFieldsData.some(
    (field) =>
      field.type?.toLowerCase() === "input" &&
      (field.title?.toLowerCase() === "twitter" ||
        field.title?.toLowerCase() === "x")
  );

  const subscribeButtonRegex = /subscribe to @\w+/i;

  const hasSubscribeButton = eventFieldsData.some(
    (field) =>
      field.type?.toLowerCase() === "button" &&
      subscribeButtonRegex.test(field.description!)
  );

  return hasInputField && hasSubscribeButton;
};

const getTwitterHandle = async (eventId: number) => {
  const eventFieldsData = await db
    .select({
      type: eventFields.type,
      title: eventFields.title,
      description: eventFields.description,
    })
    .from(eventFields)
    .where(eq(eventFields.event_id, eventId))
    .execute();

  const subscribeButtonRegex = /subscribe to @(\w+)/i;

  const matchingField = eventFieldsData.find(
    (field) =>
      field.type?.toLowerCase() === "button" &&
      subscribeButtonRegex.test(field.description!)
  );

  if (matchingField) {
    const matches = matchingField.description!.match(subscribeButtonRegex);
    return matches ? matches[1] : null;
  }

  return null;
};

function timestampToIsoString(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return date.toISOString();
}

// may be used later with another way of authentication
function createAuthHeader(
  jsonPayload: object,
  partnerId: string,
  privateKey: string
) {
  const privateKeyUint8 = naclUtil.decodeBase64(privateKey);

  const sortedPayload = JSON.stringify(
    jsonPayload,
    Object.keys(jsonPayload).sort()
  );

  const signature = nacl.sign.detached(
    naclUtil.decodeUTF8(sortedPayload),
    privateKeyUint8
  );

  const encodedSignature = naclUtil.encodeBase64(signature);

  const authHeader = `Signature partnerId="${partnerId}",algorithm="ed25519",signature="${encodedSignature}"`;

  return authHeader;
}

type HighloadWalletResponse = {
  seed_phrase: string;
  wallet_address: string;
};

type HighloadWalletTransaction = {
  receivers: { [address: string]: string };
};

const withdrawRequest = async (seedPhrase: string, address: string) => {
  try {
    const url = new URL("http://golang-server:9999/withdraw");
    url.searchParams.append("seed_phrase", seedPhrase);
    url.searchParams.append("address", address);

    const response = await axios.get(url.toString(), {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tX2hhc2giOiJiZWFyZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cCI6MTYx",
      },
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching highload wallet:", error);
    throw error;
  }
};

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tX2hhc2giOiJiZWFyZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cCI6MTYx

const distributionRequest = async (
  seedPhrase: string,
  receivers: HighloadWalletTransaction
) => {
  try {
    const response = await axios.post(
      "http://golang-server:9999/send",
      { receivers: receivers.receivers },
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tX2hhc2giOiJiZWFyZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cCI6MTYx",
          "Content-Type": "application/json",
        },
        params: {
          seed_phrase: seedPhrase, // Add seed phrase as a query parameter
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error sending highload wallet transactions:", error);
    throw error;
  }
};

const fetchHighloadWallet = async (): Promise<HighloadWalletResponse> => {
  // Setting up the golang server does not work because of connection issues with
  // db or redis in my local dev environment so this is a temporary fix for development
  if (process.env.NODE_ENV === "development") {
    return {
      wallet_address: "moc_wallet_address",
      seed_phrase: "moc seed words",
    };
  }

  try {
    const response = await axios.get(
      "http://golang-server:9999/createHighloadWallet",
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tX2hhc2giOiJiZWFyZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cCI6MTYx",
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching highload wallet:", error);
    throw error;
  }
};
