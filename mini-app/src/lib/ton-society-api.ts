// The integration with ton society apis will be here
import { TonSocietyRegisterActivityResponse } from "@/types/event.types";
import { TSAPIoperations } from "@/types/ton-society-api-types";
import { CreateUserRewardLinkReturnType, type CreateUserRewardLinkInputType } from "@/types/user.types";
import { sleep } from "@/utils";
import { TRPCError } from "@trpc/server";
import axios, { AxiosError } from "axios";

// ton society client to send http requests to https://ton-society.github.io/sbt-platform
export const tonSocietyClient = axios.create({
  baseURL: process.env.TON_SOCIETY_BASE_URL,
  headers: {
    "x-api-key": process.env.TON_SOCIETY_API_KEY,
    "x-partner-id": "onton",
  },
});

/**
 * Returns a unique reward link for users to receive rewards through particpation in activities
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
  user_id = String(user_id);
  try {
    const result = await tonSocietyClient.get(`/activities/${activity_id}/rewards/${user_id}/status`);
    return result.data as {
      status: "NOT_CLAIMED" | "CLAIMED" | "RECEIVED";
    };
  } catch (error) {
    return {
      status: "NOT_CLAIMED",
    };
  }
}
