import { db } from "@/db/db";
import { eventRegistrants, orders, user_custom_flags } from "@/db/schema";
import { selectEventByUuid } from "@/server/db/events";
import { Address } from "@ton/core";
import { InferSelectModel, and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { createUserReward } from "@/server/routers/services/rewardsService";

/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */
export async function getAuthenticatedUserApi() {
  const apiKey = cookies().get("api_key");

  if (!apiKey) {
    return [null, Response.json({ error: "Unauthorized: No Api Key provided" }, { status: 401 })];
  }

  try {
    const result = await db.query.user_custom_flags.findFirst({
      where: and(
        eq(user_custom_flags.user_flag, "api_key"),
        eq(user_custom_flags.value, apiKey?.value),
        eq(user_custom_flags.enabled, true)
      ),
    });
    if (!result) return [null, Response.json({ error: "Unauthorized: invalid Api Key" }, { status: 401 })];

    if (!result.user_id) return [null, Response.json({ error: "Unauthorized: Dangling Api Key" }, { status: 401 })];

    return [result.user_id, null];
  } catch (err) {
    return [null, Response.json({ error: "Something went wrong" }, { status: 500 })];
  }
}

/* -------------------------------------------------------------------------- */
/*                              Reward Api Schema                             */
/* -------------------------------------------------------------------------- */
const rewardCreateSchema = z.object({
  reward_user_id: z.number(),
  event_uuid: z.string().uuid(),
});

import { TRPCError } from "@trpc/server";
import { logger } from "@/server/utils/logger";

export function handleTrpcError(err: TRPCError) {
  let statusCode = 500;
  switch (err.code) {
    case "CONFLICT":
      statusCode = 409;
      break;
    case "FORBIDDEN":
      statusCode = 403;
      break;
    case "BAD_REQUEST":
      statusCode = 400;
      break;
    case "INTERNAL_SERVER_ERROR":
      statusCode = 500;
      break;
  }
  return Response.json({ message: err.message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const [userId, error] = await getAuthenticatedUserApi();
    if (error) {
      return error;
    }

    const rawBody = await request.json();

    const body = rewardCreateSchema.safeParse(rawBody);

    if (!body.success) {
      return Response.json(body.error.flatten(), {
        status: 400,
      });
    }

    const eventData = await selectEventByUuid(body.data.event_uuid);
    if (!eventData) {
      return Response.json({ message: "event not found" }, { status: 400 });
    }

    if (eventData.owner !== userId) return Response.json({ message: "Unauthorized Access to event" }, { status: 401 });

    try {
      const reward_result = await createUserReward({
        user_id: body.data.reward_user_id,
        event_uuid: body.data.event_uuid,
      });
      return Response.json(reward_result);
    } catch (error) {
      if (error instanceof TRPCError) handleTrpcError(error);
      logger.error("creating_reward_api_error", error);
      return Response.json({ message: "Someting Went Wrong with Creating reward" }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ message: "Someting Went Wrong" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
