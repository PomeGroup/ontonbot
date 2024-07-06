// The integration with ton society apis will be here
// TODO: move old integrations here

import { CreateUserRewardLinkReturnType, type CreateUserRewardLinkInputType } from "@/types/user.types"
import axios from "axios"

// ton society client to send http requests to https://ton-society.github.io/sbt-platform
export const tonSocietyClient = axios.create({
  baseURL: process.env.TON_SOCIETY_BASE_URL,
  headers: {
    'x-api-key': process.env.TON_SOCIETY_API_KEY,
    'x-partner-id': 'onton',

  }
})

/**
  * Returns a unique reward link for users to receive rewards through particpation in activities
  * more: https://ton-society.github.io/sbt-platform/#/Activities/createRewardLink
  *
  */
export async function createUserRewardLink(activityId: number, data: CreateUserRewardLinkInputType) {
  return await tonSocietyClient.post<CreateUserRewardLinkReturnType>(`/activities/${activityId}/rewards`, data)
}

