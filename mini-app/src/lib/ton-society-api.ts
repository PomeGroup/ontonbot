// The integration with ton society apis will be here
import {
    TonSocietyRegisterActivityResponse,
    TonSocietyRegisterActivityT,
} from '@/types/event.types'
import {
    CreateUserRewardLinkReturnType,
    type CreateUserRewardLinkInputType,
} from '@/types/user.types'
import { Address } from '@ton/core'
import axios, { AxiosError } from 'axios'

// ton society client to send http requests to https://ton-society.github.io/sbt-platform
export const tonSocietyClient = axios.create({
    baseURL: process.env.TON_SOCIETY_BASE_URL,
    headers: {
        'x-api-key': process.env.TON_SOCIETY_API_KEY,
        'x-partner-id': 'onton',
    },
})

/**
 * Returns a unique reward link for users to receive rewards through particpation in activities
 * more: https://ton-society.github.io/sbt-platform/#/Activities/createRewardLink
 */
export async function createUserRewardLink(
    activityId: number,
    data: CreateUserRewardLinkInputType
) {
    try {
        return await tonSocietyClient.post<CreateUserRewardLinkReturnType>(
            `/activities/${activityId}/rewards`,
            data
        )
    } catch (error) {
        if (
            error instanceof AxiosError &&
            error.response?.data?.message ===
                'reward link with such activity id and wallet address already created'
        ) {
            return await tonSocietyClient.get<CreateUserRewardLinkReturnType>(
                `/activities/${activityId}/rewards/${Address.parse(
                    data.wallet_address
                ).toString()}`
            )
        }

        throw error
    }
}

/**
 * An endpoint that allows to create a new activity of the "Events" activity group.
 * more: https://ton-society.github.io/sbt-platform/#/Activities/createEvent
 */
export async function registerActivity(
    activityDetails: TonSocietyRegisterActivityT
) {
    const response = await tonSocietyClient.post('/activities', activityDetails)
    return response.data as TonSocietyRegisterActivityResponse
}

/**
 * An endpoint that allows to create a new activity of the "Events" activity group.
 * more: https://ton-society.github.io/sbt-platform/#/Activities/updateEvent
 */
export async function updateActivity(
    activityDetails: TonSocietyRegisterActivityT,
    activity_id: string | number
) {
    const response = await tonSocietyClient.patch(
        `/activities/${activity_id}`,
        activityDetails
    )
    return response.data as { status: 'success'; data: {} }
}
