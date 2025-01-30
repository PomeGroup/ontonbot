import { db } from "@/db/db";
import { user_custom_flags } from "@/db/schema";
import { selectEventByUuid } from "@/server/db/events";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";
import { createUserReward } from "@/server/routers/services/rewardsService";
import { TRPCError } from "@trpc/server";
import { logger } from "@/server/utils/logger";
import { getAuthenticatedUserApi } from "@/server/auth";
import { handleTrpcError } from "@/server/utils/error_utils";
import { createUserRewardLink } from "@/lib/ton-society-api";

/* -------------------------------------------------------------------------- */
/*                              Reward Api Schema                             */
/* -------------------------------------------------------------------------- */
const rewardCreateSchema = z.object({
  reward_user_id: z.number(),
  event_uuid: z.string().uuid(),
});

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

    if (!eventData.activity_id) return Response.json({ message: "Event Not Published Yet" }, { status: 400 });

    try {
      const society_hub_value =
        typeof eventData.society_hub === "string" ? eventData.society_hub : eventData.society_hub?.name || "Onton";

      const res = await createUserRewardLink(eventData.activity_id, {
        telegram_user_id: body.data.reward_user_id,
        attributes: eventData?.society_hub
          ? [
              {
                trait_type: "Organizer",
                value: society_hub_value,
              },
            ]
          : undefined,
      });

      // Ensure the response contains data
      if (!res || !res.data || !res.data.data) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Failed to create user reward link.",
        });
      }
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
