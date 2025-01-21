import { db } from "@/db/db";
import { eventFields, events, eventPayment, orders } from "@/db/schema";
import { hashPassword } from "@/lib/bcrypt";
import {
  renderAddEventMessage,
  renderModerationEventMessage,
  renderUpdateEventMessage,
  sendLogNotification,
} from "@/lib/tgBot";
import { registerActivity, updateActivity } from "@/lib/ton-society-api";
import { getObjectDifference, removeKey } from "@/lib/utils";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { TRPCError } from "@trpc/server";
import dotenv from "dotenv";
import { and, eq, ne } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import eventDB from "@/server/db/events";
import {
  adminOrganizerProtectedProcedure,
  eventManagementProtectedProcedure as eventManagerPP,
  initDataProtectedProcedure,
  publicProcedure,
  router,
} from "../trpc";
import { TonSocietyRegisterActivityT } from "@/types/event.types";
import eventFieldsDB from "@/server/db/eventFields.db";
import { internal_server_error } from "../utils/error_utils";
import { EventPaymentSelectType } from "@/db/schema/eventPayment";
import { is_dev_env, is_stage_env } from "../utils/evnutils";
import { config } from "../config";
import { logger } from "@/server/utils/logger";
import { eventRegistrantsDB } from "@/server/db/eventRegistrants.db";
import { timestampToIsoString } from "@/lib/DateAndTime";
import { CreateTonSocietyDraft } from "@/server/routers/services/tonSocietyService";
import { usersDB, getUserCacheKey } from "../db/users";
import { redisTools } from "@/lib/redisTools";
import { organizerTsVerified, userHasModerationAccess } from "../db/userFlags.db";
dotenv.config();

function get_paid_event_price(capacity: number) {
  const reduced_price = is_dev_env() || is_stage_env();

  return reduced_price ? 0.001 + 0.00055 * capacity : 10 + 0.06 * capacity;
}

async function shouldEventBeHidden(event_is_paid: boolean, user_id: number) {
  if (event_is_paid) return true;

  const is_ts_verified = await organizerTsVerified(user_id);

  if (!is_ts_verified) return true;

  return false;
}

/* -------------------------------------------------------------------------- -------------------------------------------- */
/* -------------------------------------------------------------------------- -------------------------------------------- */
/* -------------------------------------------------------------------------- -------------------------------------------- */
/* -------------------------------------------------------------------------- -------------------------------------------- */
/* -------------------------------------------------------------------------- -------------------------------------------- */
/* -------------------------------------------------------------------------- -------------------------------------------- */
/* -------------------------------------------------------------------------- -------------------------------------------- */

const getEvent = initDataProtectedProcedure.input(z.object({ event_uuid: z.string() })).query(async (opts) => {
  const userId = opts.ctx.user.user_id;
  const userRole = opts.ctx.user.role;
  const event_uuid = opts.input.event_uuid;
  const eventData = {
    payment_details: {} as Partial<EventPaymentSelectType>,
    ...(await eventDB.selectEventByUuid(event_uuid)),
  };
  let capacity_filled = false;
  let registrant_status: "pending" | "rejected" | "approved" | "checkedin" | "" = "";
  let registrant_uuid = "";

  if (!eventData) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "event not found",
    });
  }

  //If event is hidden or not enabled
  if (eventData.hidden || !eventData.enabled) {
    if (userId !== eventData.owner && userRole !== "admin" && !(await userHasModerationAccess(userId, userRole))) {
      throw new TRPCError({ code: "NOT_FOUND", message: "event is not published yet" });
    }
  }

  //    Fetch user data for event owner
  //    We'll rename org_* fields to 'organizer: { ... }' in the returned object.
  const ownerUserId = eventData.owner; // This is the user_id who created the event
  const ownerUser = await usersDB.selectUserById(Number(ownerUserId));

  // Build an organizer object with the org_* fields (or null if no user found)
  const organizer = ownerUser
    ? {
        org_channel_name: ownerUser.org_channel_name === null ? ownerUser.first_name : ownerUser.org_channel_name,
        org_support_telegram_user_name: ownerUser.org_support_telegram_user_name,
        org_x_link: ownerUser.org_x_link,
        org_bio: ownerUser.org_bio,
        org_image: ownerUser.org_image === null ? ownerUser.photo_url : ownerUser.org_image,
        user_id: ownerUser.user_id,
        username: ownerUser.username,
        first_name: ownerUser.first_name,
        hosted_event_count: ownerUser.hosted_event_count,
      }
    : null;

  // If the event does NOT require registration, just return data
  if (!eventData.has_registration) {
    return { capacity_filled, registrant_status, organizer, ...eventData, registrant_uuid };
  }
  /* ------------------------ Event Needs Registration ------------------------ */

  const user_request = await eventRegistrantsDB.getRegistrantRequest(event_uuid, userId);
  const event_location = eventData.location;

  const userIsAdminOrOwner = eventData.owner == userId || userRole == "admin";
  let mask_event_capacity = !userIsAdminOrOwner;

  eventData.location = "Visible To Registered Users";

  if (userIsAdminOrOwner) {
    eventData.location = event_location;
    //event payment info
    if (eventData.has_payment) {
      const payment_details = (
        await db.select().from(eventPayment).where(eq(eventPayment.event_uuid, event_uuid)).execute()
      ).pop();
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
      organizer,
      ...eventData,
      registrant_uuid,
      capacity: mask_event_capacity ? 99 : eventData.capacity,
    };
  }

  // no status for registrant
  if (eventData.capacity) {
    const approved_requests_count = await eventRegistrantsDB.getApprovedRequestsCount(event_uuid);
    if (approved_requests_count >= eventData.capacity) {
      // Event capacity filled
      capacity_filled = true;
      return {
        capacity_filled,
        registrant_status,
        organizer,
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
    organizer,
    ...eventData,
    registrant_uuid,
    capacity: mask_event_capacity ? 99 : eventData.capacity,
  };
});

// private
const getEvents = adminOrganizerProtectedProcedure.query(async (opts) => {
  if (opts.ctx.userRole !== "admin" && opts.ctx.userRole !== "organizer") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `Unauthorized access, invalid role for ${opts.ctx.user?.user_id}`,
    });
  }
  return await eventDB.getEventsForSpecialRole(opts.ctx.userRole, opts.ctx.user?.user_id);
});

/* -------------------------------------------------------------------------- */
/*                                  🆕Add Event🆕                            */
/* -------------------------------------------------------------------------- */
// private
const addEvent = adminOrganizerProtectedProcedure.input(z.object({ eventData: EventDataSchema })).mutation(async (opts) => {
  const input_event_data = opts.input.eventData;

  const user_id = opts.ctx.user.user_id;
  const userCacheKey = getUserCacheKey(user_id);

  try {
    const result = await db.transaction(async (trx) => {
      const event_has_payment = input_event_data.paid_event && input_event_data.paid_event.has_payment;
      const event_in_person = input_event_data.eventLocationType === "in_person";
      let hashedSecretPhrase = undefined;
      let inputSecretPhrase = undefined;
      if (!event_in_person && input_event_data?.secret_phrase) {
        inputSecretPhrase = input_event_data?.secret_phrase.trim().toLowerCase();
        hashedSecretPhrase = Boolean(inputSecretPhrase) ? await hashPassword(inputSecretPhrase) : undefined;
        if (!hashedSecretPhrase) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid secret phrase" });
      }
      /* ------------------------------ Invalid Dates ----------------------------- */
      if (!input_event_data.end_date || !input_event_data.start_date) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid start-date/end-date" });
      }
      /* ------------------------- Event Duration > 1 Week ------------------------ */
      //FIXME -  Discuss With Mike

      // if (input_event_data.end_date! - input_event_data.start_date > 604801) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "Event Duration Can't be more than 1 week",
      //   });
      // }
      /* -------------------------------------------------------------------------- */

      /* ------------------- paid events must have registration ------------------- */
      input_event_data.has_registration = event_has_payment ? true : input_event_data.has_registration;
      const is_paid = !!input_event_data.paid_event?.has_payment;
      if (is_paid && !config?.ONTON_WALLET_ADDRESS) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ONTON_WALLET_ADDRESS NOT SET error" });
      }

      const event_should_hidden = await shouldEventBeHidden(is_paid, user_id);

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
          owner: user_id,
          participationType: input_event_data.eventLocationType, // right now paid event only can be in_person
          countryId: input_event_data.countryId,
          tsRewardImage: input_event_data.ts_reward_url,
          tsRewardVideo: input_event_data.video_url,
          cityId: input_event_data.cityId,
          /* --------------------------- Event Registration --------------------------- */
          has_registration: input_event_data.has_registration,
          has_approval: input_event_data.has_approval,
          capacity: input_event_data.capacity,
          has_waiting_list: input_event_data.has_waiting_list,

          /* -------------------------- Publish Event Or Not -------------------------- */
          enabled: true,
          hidden: event_should_hidden,
          /* ------------------------------- Paid Event ------------------------------- */
          has_payment: is_paid,
          ticketToCheckIn: is_paid, // Duplicated Column same as has_payment 😐
          wallet_address: is_paid ? config?.ONTON_WALLET_ADDRESS : null,
          /* ------------------------------- Paid Event ------------------------------- */
        })
        .returning();

      const eventData = newEvent[0];
      /* -------------------------------------------------------------------------- */
      /*                     Paid Event : Insert Payment Details                    */
      /* -------------------------------------------------------------------------- */

      if (input_event_data.paid_event && event_has_payment) {
        if (!input_event_data.capacity)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Capacity Required for paid events" });

        const order_price = get_paid_event_price(input_event_data.capacity);

        await trx.insert(orders).values({
          event_uuid: eventData.event_uuid,
          user_id: user_id,
          total_price: order_price,
          payment_type: "TON",
          state: "new",
          order_type: "event_creation",
          owner_address: "",
        });

        let event_ticket_price = Math.max(input_event_data.paid_event.payment_amount || 0, 0.001); // Price > 0.001
        event_ticket_price = Math.round(event_ticket_price * 1000) / 1000; // Round to 3 Decimals
        event_ticket_price = event_ticket_price || 0.001;

        await trx.insert(eventPayment).values({
          event_uuid: newEvent[0].event_uuid,
          /* -------------------------------------------------------------------------- */
          payment_type: input_event_data.paid_event.payment_type || "TON",
          price: event_ticket_price,
          recipient_address: input_event_data.paid_event.payment_recipient_address,
          bought_capacity: input_event_data.capacity,
          /* -------------------------------------------------------------------------- */
          ticket_type: input_event_data.paid_event.has_nft ? "NFT" : "OFFCHAIN",
          ticketImage: input_event_data.paid_event.nft_image_url,
          title: input_event_data.paid_event.nft_title,
          description: input_event_data.paid_event.nft_description,
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
          updatedBy: user_id.toString(),
        });
      }

      // Insert secret phrase field if applicable
      if (!event_in_person && input_event_data?.secret_phrase && input_event_data?.secret_phrase && inputSecretPhrase) {
        await eventFieldsDB.insertEventField(trx, {
          emoji: "🔒",
          title: "secret_phrase_onton_input",
          description: "Enter the event password",
          placeholder: "Enter the event password",
          type: "input",
          order_place: input_event_data.dynamic_fields.length,
          event_id: newEvent[0].event_id,
          updatedBy: user_id.toString(),
        });
      }

      const eventDraft = await CreateTonSocietyDraft(input_event_data, eventData.event_uuid);
      logger.log("eventDraft", JSON.stringify(eventDraft));
      logger.log("eventData", eventData);
      // Generate the message using the render function
      const logMessage = renderModerationEventMessage(opts.ctx.user.username || user_id, eventData);
      await sendLogNotification({
        message: logMessage,
        topic: "event",
      });
      logger.log("add event telegram notification sent", logMessage);
      // Clear the organizer user cache so it will be reloaded next time
      await redisTools.deleteCache(userCacheKey);

      // Skip Register to ts if :
      //  local development  || paid event registers organizer pays initial payment || org must be verified
      const register_to_ts = process.env.ENV !== "local" && !event_should_hidden;

      if (register_to_ts) {
        const res = await registerActivity(eventDraft);

        await trx
          .update(events)
          .set({
            activity_id: res.data.activity_id,
            updatedBy: user_id.toString(),
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
    logger.error(`Error while adding event: ${Date.now()} , ${error}`);
    if (error instanceof TRPCError) {
      throw error;
    }
    internal_server_error(error, "Internal Error while adding event");
  }
});

/* -------------------------------------------------------------------------- */
/*                                🐳🦞Update Event🐳🦞                      */
/* -------------------------------------------------------------------------- */

const updateEvent = eventManagerPP
  .input(
    z.object({
      eventData: UpdateEventDataSchema,
    })
  )
  .mutation(async (opts) => {
    const eventData = opts.input.eventData;
    const eventUuid = opts.ctx.event.event_uuid;
    const eventId = opts.ctx.event.event_id;
    const user_id = opts.ctx.user.user_id;

    try {
      return await db.transaction(async (trx) => {
        const inputSecretPhrase = eventData.secret_phrase ? eventData.secret_phrase.trim().toLowerCase() : undefined;
        const hashedSecretPhrase = inputSecretPhrase ? await hashPassword(inputSecretPhrase) : undefined;
        const oldEvent = (await trx.select().from(events).where(eq(events.event_uuid, eventUuid!)).execute()).pop();

        if (!oldEvent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Old Event Not Found",
          });
        }

        const canUpdateRegistrationSetting = oldEvent.has_registration;

        /* -------------------------------------------------------------------------- */
        /*                                 Paid Event                                 */
        /* -------------------------------------------------------------------------- */
        //can't have capacity null if it's paid event
        //should create order for increasing capacity
        if (oldEvent.has_payment) {
          /* -------------------------------------------------------------------------- */
          //can't have capacity null if it's paid event
          if (!eventData.capacity) throw new TRPCError({ code: "BAD_REQUEST", message: "Paid Events Must have capacity" });
          /* -------------------------------------------------------------------------- */
          const paymentInfo = (
            await trx.select().from(eventPayment).where(eq(eventPayment.event_uuid, eventUuid)).execute()
          ).pop();

          if (!paymentInfo)
            throw new TRPCError({ code: "BAD_REQUEST", message: `error: paymentInfo not found for ${eventUuid}` });

          // Update Create Order If Event is not published yet
          if (!oldEvent.enabled && eventData.capacity < paymentInfo!.bought_capacity) {
            const where_condition = and(
              eq(orders.event_uuid, eventUuid),
              eq(orders.order_type, "event_creation"),
              ne(orders.state, "processing"),
              ne(orders.state, "completed")
            );
            const createEventOrder = await trx.query.orders.findFirst({ where: where_condition });

            if (createEventOrder) {
              await trx
                .update(orders)
                .set({ total_price: get_paid_event_price(eventData.capacity) })
                .where(where_condition)
                .execute();
              await trx.update(eventPayment).set({ bought_capacity: eventData.capacity });
            }
          }

          /* ------------------- Create Order For Increase Capacity ------------------- */
          if (eventData.capacity > paymentInfo!.bought_capacity) {
            // Increase in event capacity
            // create an update_capacity_order if not exists otherwise just update it
            const update_order = (
              await trx
                .select()
                .from(orders)
                .where(and(eq(orders.event_uuid, eventUuid), eq(orders.order_type, "event_capacity_increment")))
                .execute()
            ).pop();
            /* -------------------- update order exists and its paid -------------------- */
            if (update_order && update_order.state == "processing") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "You Already have a Paid Capacity Update pending ... please try again in few minutes ",
              });
            }
            /* -------------------------------------------------------------------------- */
            /* ---------------------------- Update OR Insert ---------------------------- */
            const upsert_data = {
              event_uuid: eventUuid,
              order_type: "event_capacity_increment" as const,
              state: "new" as const,
              payment_type: "TON" as const,
              total_price: 0.06 * (eventData.capacity - paymentInfo!.bought_capacity),
              user_id: user_id,
            };
            if (update_order && (update_order.state === "new" || update_order.state === "confirming")) {
              await trx.update(orders).set(upsert_data).where(eq(orders.uuid, update_order.uuid));
            } else {
              await trx.insert(orders).values(upsert_data);
            }
            //can't update capacity unless organizer pays
            eventData.capacity = oldEvent.capacity!;
          }
        }

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
            has_approval: canUpdateRegistrationSetting ? eventData.has_approval : false,
            capacity: canUpdateRegistrationSetting ? eventData.capacity : null,
            has_waiting_list: canUpdateRegistrationSetting ? eventData.has_waiting_list : false,
            /* ------------------------ Event Registration Update ----------------------- */
          })
          .where(eq(events.event_uuid, eventUuid))
          .returning()
          .execute();

        //Only recipient_address and price can be updated
        if (eventData.paid_event?.has_payment && oldEvent.has_payment) {
          let price = Math.max(eventData.paid_event.payment_amount || 0, 0.001); // Price > 0.001
          price = Math.round(price * 1000) / 1000; // Round to 3 Decimals

          await trx
            .update(eventPayment)
            .set({
              recipient_address: eventData.paid_event.payment_recipient_address,
              price: price,
            })
            .where(eq(eventPayment.event_uuid, oldEvent.event_uuid));
        }

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
          .where(and(eq(eventFields.event_id, eventId!), eq(eventFields.title, "secret_phrase_onton_input")))
          .execute();

        if (hashedSecretPhrase || (hashedSecretPhrase === undefined && oldEvent.ticketToCheckIn === false)) {
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

        for (const [index, field] of eventData.dynamic_fields
          .filter((f) => f.title !== "secret_phrase_onton_input")
          .entries()) {
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
        const oldEventWithoutDescription = removeKey(oldEvent, "description");

        const oldChanges = getObjectDifference(updatedEventWithoutDescription, oldEventWithoutDescription);

        const updateChanges = getObjectDifference(updatedEventWithoutDescription, oldEventWithoutDescription);

        // if it was a fully local setup we don't want to update the activity_id
        if (process.env.ENV !== "local") {
          try {
            await updateActivity(eventDraft, opts.ctx.event.activity_id as number);
          } catch (error) {
            logger.log("update_event_ton_society_failed", JSON.stringify(eventDraft));

            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to update ton Society activity_id : ${opts.ctx.event.activity_id}`,
            });
          }
        }
        const logMessage = renderUpdateEventMessage(
          opts.ctx.user.username || opts.ctx.user.user_id,
          eventUuid,
          oldChanges,
          updateChanges
        );
        logger.log("update event telegram notification sent", logMessage);
        await sendLogNotification({ message: logMessage, topic: "event" });

        return { success: true, eventId: opts.ctx.event.event_uuid } as const;
      });
    } catch (err) {
      logger.error(`[eventRouter]_update_event failed id: ${opts.ctx.event.event_uuid}, error: ${err}`, {
        input: opts.input,
      });

      internal_server_error(err, `Failed to update event ${opts.ctx.event.event_uuid}`);
    }
  });

const getEventsWithFilters = publicProcedure.input(searchEventsInputZod).query(async (opts) => {
  try {
    const events = await eventDB.getEventsWithFilters(opts.input);
    return { status: "success", data: events };
  } catch (error) {
    logger.error("Error fetching events:", error);
    return { status: "fail", data: null };
  }
});

export const getEventsWithFiltersInfinite = publicProcedure.input(searchEventsInputZod).query(async ({ input }) => {
  // Instead of passing `limit`, pass `limit + 1`
  const dbResult = await eventDB.getEventsWithFilters({
    ...input,
    // tell the DB function: fetch an extra row
    limit: (input.limit ?? 10) + 1,
  });

  const actualLimit = input.limit ?? 10;
  let nextCursor: number | null = null;

  if (dbResult.length > actualLimit) {
    nextCursor = input.cursor + 1;
  }

  return {
    items: dbResult,
    nextCursor,
  };
});
/* -------------------------------------------------------------------------- */
/*                                   Router                                   */
/* -------------------------------------------------------------------------- */
export const eventsRouter = router({
  getEvent,
  getEvents, // private
  addEvent, //private
  updateEvent, //private
  getEventsWithFilters,
  getEventsWithFiltersInfinite,
});
