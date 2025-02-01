// The integration with ton society apis will be here
import { TonSocietyRegisterActivityResponse } from "@/types/event.types";
import { findActivityResponseType, TSAPIoperations } from "@/types/ton-society-api-types";
import { CreateUserRewardLinkReturnType, type CreateUserRewardLinkInputType } from "@/types/user.types";
import { sleep } from "@/utils";
import { TRPCError } from "@trpc/server";
import axios, { AxiosError } from "axios";
import { HubsResponse, SocietyHub } from "@/types";
import { redisTools } from "@/lib/redisTools";
import { configDotenv } from "dotenv";

configDotenv();
// ton society client to send http requests to https://ton-society.github.io/sbt-platform
export const tonSocietyClient = axios.create({
  baseURL: process.env.TON_SOCIETY_BASE_URL,
  headers: {
    "x-api-key": process.env.TON_SOCIETY_API_KEY,
    "x-partner-id": "onton",
  },
});

/**
 * Returns a unique reward link for users to receive rewards through participation in activities
 * more: https://ton-society.github.io/sbt-platform/#/Activities/createRewardLink
 */
export async function createUserRewardLink(
  activityId: number,
  data: CreateUserRewardLinkInputType
): Promise<{ data: CreateUserRewardLinkReturnType }> {
  try {
    return await tonSocietyClient.get<CreateUserRewardLinkReturnType>(
      `/activities/${activityId}/rewards/${data.telegram_user_id}`
    );
  } catch (error) {
    try {
      return await tonSocietyClient.post<CreateUserRewardLinkReturnType>(`/activities/${activityId}/rewards`, data);
    } catch (error) {
      if (
        error instanceof AxiosError &&
        (error.response?.data?.message === "reward link with such activity id and wallet address already created" ||
          error.response?.data?.message === "reward link with such activity id and telegram user id already created")
      ) {
        return await tonSocietyClient.get<CreateUserRewardLinkReturnType>(
          `/activities/${activityId}/rewards/${data.telegram_user_id}`
        );
      }

      // console.error(`CREATE_REWARD_ERROR_${Date.now()}`, error);
      // console.error(
      //   `CREATE_REWARD_ERROR_REQUEST_${Date.now()}`,
      //   `/activities/${activityId}/rewards/${data.telegram_user_id}`
      // );

      await sleep(100);

      throw error;
    }
  }
}

/**
 * An endpoint that allows to create a new activity of the "Events" activity group.
 * more: https://ton-society.github.io/sbt-platform/#/Activities/createEvent
 */
export async function registerActivity(
  activityDetails: TSAPIoperations["createEvent"]["requestBody"]["content"]["application/json"]
) {
  const response = await tonSocietyClient.post("/activities", activityDetails);
  return response.data as TonSocietyRegisterActivityResponse;
}

export type CreateActivityRequestBody = TSAPIoperations["createEvent"]["requestBody"]["content"]["application/json"];

/**
 * An endpoint that allows to create a new activity of the "Events" activity group.
 * more: https://ton-society.github.io/sbt-platform/#/Activities/updateEvent
 */
export async function updateActivity(
  activityDetails: TSAPIoperations["updateEvent"]["requestBody"]["content"]["application/json"],
  activity_id: string | number
) {
  if (!activity_id)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "event does not have a valid activity id",
    });
  const response = await tonSocietyClient.patch(`/activities/${activity_id}`, activityDetails);
  return response.data as { status: "success"; data: {} };
}

export async function getSBTClaimedStaus(activity_id: number, user_id: number | string) {
  if (!user_id || !activity_id) {
    return { status: `Wrong_avtivity_${activity_id}` };
  }

  user_id = String(user_id);
  try {
    const result = await tonSocietyClient.get(`/activities/${activity_id}/rewards/${user_id}/status`);
    return result.data.data as {
      status: "NOT_CLAIMED" | "CLAIMED" | "RECEIVED";
    };
  } catch (error) {
    return {
      status: "NOT_ELIGBLE",
    };
  }
}

export async function findActivity(activity_id: number): Promise<findActivityResponseType> {
  if (!activity_id) {
    throw new Error("wrong activity id");
  }

  const result = await tonSocietyClient.get(`/activities/${activity_id}`);
  return result.data;
}

export async function getHubs(): Promise<SocietyHub[]> {
  // Define a cache key – you can parameterize if needed.
  const cacheKey = redisTools.cacheKeys.hubs;

  // 1. Try to read from the cache
  const cachedResult: SocietyHub[] = await redisTools.getCache(cacheKey);
  if (cachedResult) {
    // If we have a cached copy, return it
    return cachedResult;
  }

  try {
    // 2. Otherwise, fetch fresh data
    const response = await tonSocietyClient.get<HubsResponse>("/hubs", {
      params: {
        _start: 0,
        _end: 100,
      },
    });

    if (response.status === 200 && response.data) {
      // sort hubs by attributes.title
      const sortedHubs = response.data.data.sort((a, b) => a.attributes.title.localeCompare(b.attributes.title));
      const transformedHubs = sortedHubs.map((hub) => ({
        id: hub.id.toString(),
        name: hub.attributes.title,
      }));

      // 3. Cache the transformed result
      await redisTools.setCache(cacheKey, transformedHubs, redisTools.cacheLvl.medium);

      // 4. Return the data
      return transformedHubs;
    }

    // If response is invalid:
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch hubs data",
    });
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch hubs data",
    });
  }
}
