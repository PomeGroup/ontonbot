import { db } from "@/db/db";
import { user_custom_flags } from "@/db/schema";
import { selectEventByUuid } from "@/server/db/events";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";
import { createUserReward } from "@/server/routers/services/rewardsService";
import { TRPCError } from "@trpc/server";
import { logger } from "@/server/utils/logger";
/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */
export async function getAuthenticatedUserApi(req: Request) {
  const apiKey = req.headers.get("api_key") || "";

  if (!apiKey) {
    return [null, Response.json({ error: "Unauthorized: No Api Key provided" }, { status: 401 })];
  }

  try {
    const result = await db.query.user_custom_flags.findFirst({
      where: and(
        eq(user_custom_flags.user_flag, "api_key"),
        eq(user_custom_flags.value, apiKey),
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

/* -------------------------------------------------------------------------- */
/*                          TRPCError Error Converter                         */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*                                 Main Route                                 */
/* -------------------------------------------------------------------------- */
export async function POST(request: Request) {
  try {
    const [userId, error] = await getAuthenticatedUserApi(request);
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
    logger.log("reward_api_call", body);
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
      logger.error("reward_api_creation_error", error);
      return Response.json({ message: "Someting Went Wrong with Creating reward" }, { status: 500 });
    }
  } catch (error) {
    logger.error("reward_api_general_error", error);

    return Response.json({ message: "Someting Went Wrong" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
