import { eventManagementProtectedProcedure as evntManagerPP, initDataProtectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { selectEventByUuid } from "@/server/db/events";
import { TRPCError } from "@trpc/server";
import { db, dbLower } from "@/db/db";
import { eventRegistrants } from "@/db/schema/eventRegistrants";
import { and, desc, eq, like, ne, or, sql } from "drizzle-orm";
import rewardService from "@/server/routers/services/rewardsService";
import telegramService from "@/server/routers/services/telegramService";
import { EventRegisterSchema } from "@/types";
import { eventRegistrantsDB } from "@/server/db/eventRegistrants.db";
import { addVisitor } from "@/server/db/visitors";
import { users } from "@/db/schema/users";
import { redisTools } from "@/lib/redisTools";
import { getUserCacheKey } from "@/server/db/users";
import { rewards, visitors } from "@/db/schema";

const checkinRegistrantRequest = evntManagerPP
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
    const registrant = (
      await db.select().from(eventRegistrants).where(eq(eventRegistrants.registrant_uuid, registrant_uuid)).execute()
    ).pop();

    if (!registrant) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Registrant Not Found/Invalid for ${event_uuid} and registrant_uuid ${registrant_uuid}`,
      });
    }
    if (registrant.event_uuid !== event_uuid) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Registrant Not for this event ${event_uuid} and registrant_uuid ${registrant_uuid}`,
      });
    }

    if (registrant.status === "checkedin") {
      return { code: 200, message: "Already Checked-in" };
    }
    if (registrant.status !== "approved") {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Registrant Not Approved for this event ${event_uuid} and registrant_uuid ${registrant_uuid}`,
      });
    }

    await rewardService.createUserReward(
      {
        user_id: registrant.user_id as number,
        event_uuid: event_uuid,
      },
      true
    );

    await db
      .update(eventRegistrants)
      .set({
        status: "checkedin",
      })
      .where(eq(eventRegistrants.registrant_uuid, registrant_uuid))
      .execute();

    const final_message = event.has_payment ? "Reward Link will be sent to user" : "User can claim reward on the event page";
    return { code: 200, message: final_message };
  });

const processRegistrantRequest = evntManagerPP
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
      .where(
        and(
          eq(eventRegistrants.event_uuid, event_uuid),
          eq(eventRegistrants.user_id, user_id),
          ne(eventRegistrants.status, "checkedin")
        )
      )
      .execute();

    if (opts.input.status === "approved" || opts.input.status === "rejected") {
      const share_link = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${event_uuid}`;

      const approved_message = `✅ Your request has been approved for the event : <b>${event.title}</b> \n${share_link}`;
      const rejected_message = `❌ Your request has been rejected for the event : <b>${event.title}</b> \n${share_link}`;
      const message = opts.input.status === "approved" ? approved_message : rejected_message;

      await telegramService.sendEventPhoto({
        event_id: event.event_uuid,
        user_id: user_id,
        message,
      });

      // Clear the organizer user cache so it will be reloaded next time
      await redisTools.deleteCache(getUserCacheKey(user_id));
    }

    return { code: 201, message: "ok" };
  });

const eventRegister = initDataProtectedProcedure.input(CombinedEventRegisterSchema).mutation(async (opts) => {
  const userId = opts.ctx.user.user_id;
  const { event_uuid, ...registerInfo } = opts.input;
  const event = await selectEventByUuid(event_uuid);
  if (!event) {
    throw new TRPCError({ code: "NOT_FOUND", message: `event not found with uuid ${event_uuid}` });
  }

  if (!event.has_registration) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `event is not registrable with uuid ${event_uuid}`,
    });
  }

  if (event.has_payment) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `event has payment buy the ticket with uuid ${event_uuid}`,
    });
  }

  const user_request = await eventRegistrantsDB.getRegistrantRequest(event_uuid, userId);

  if (user_request) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `registrant already has a [${user_request.status}] Request `,
    });
  }

  let event_filled_and_has_waiting_list = false;

  if (event.capacity) {
    const approved_requests_count = await eventRegistrantsDB.getApprovedRequestsCount(event_uuid);
    const event_cap_filled = approved_requests_count >= event.capacity;

    event_filled_and_has_waiting_list = !!(event_cap_filled && event.has_waiting_list);

    if (event_cap_filled && !event.has_waiting_list) {
      // Event capacity filled and no waiting list
      throw new TRPCError({
        code: "CONFLICT",
        message: `Event Capacity Reached for event ${event.event_uuid}`,
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
  // Clear the organizer user cache so it will be reloaded next time
  await redisTools.deleteCache(getUserCacheKey(userId));

  return { message: "success", code: 201 };
});

const getEventRegistrants = evntManagerPP
  .input(
    z.object({
      event_uuid: z.string(),
      offset: z.number().default(0),
      limit: z.number().default(10),
      search: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const { event_uuid, offset, limit, search } = opts.input;

    const event = await selectEventByUuid(event_uuid);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: `Event not found with uuid ${event_uuid}` });
    }

    // base condition for the event registrants
    let condition = event.has_payment
      ? and(
          or(eq(eventRegistrants.status, "approved"), eq(eventRegistrants.status, "checkedin")),
          eq(eventRegistrants.event_uuid, event_uuid)
        )
      : eq(eventRegistrants.event_uuid, event_uuid);

    // If a search query is provided, extend the condition to filter by username, first_name, or last_name
    if (search && search.trim() !== "") {
      const searchStr = `%${search.trim()}%`;
      condition = and(
        condition,
        or(
          // @ts-expect-error
          like(dbLower(users.username), dbLower(searchStr)),
          // @ts-expect-error
          like(dbLower(users.first_name), dbLower(searchStr)),
          // @ts-expect-error
          like(dbLower(users.last_name), dbLower(searchStr))
        )
      );
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
        registrant_info: eventRegistrants.register_info,
        has_reward: sql<boolean>`exists(
          ${db
            .select()
            .from(rewards)
            .innerJoin(visitors, eq(rewards.visitor_id, visitors.id))
            .where(
              and(eq(visitors.user_id, eventRegistrants.user_id), eq(visitors.event_uuid, eventRegistrants.event_uuid))
            )})`.as("has_reward"),
      })
      .from(eventRegistrants)
      .innerJoin(users, eq(eventRegistrants.user_id, users.user_id))
      .where(condition)
      .orderBy(desc(eventRegistrants.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return registrants;
  });

export const registrantRouter = router({
  checkinRegistrantRequest,
  processRegistrantRequest,
  eventRegister,
  getEventRegistrants,
});
