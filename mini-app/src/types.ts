import { z } from 'zod'
import { serverClient } from './app/_trpc/serverClient'

export type InputField = {
    type: string
    title: string
    description: string
    placeholder: string
    emoji: string
}

export type ButtonField = {
    type: string
    title: string
    description: string
    url: string
    emoji: string
}

export type FieldElement = InputField | ButtonField

export interface HubsResponse {
    status: string
    data: HubType[]
}

export interface HubType {
    id: number
    attributes: Attributes
}

export interface Attributes {
    title: string
    url: string
    createdAt: string
    updatedAt: string
    publishedAt: string
}

export type TRequiredEventFields = {
    type: number
    title: string
    subtitle: string
    description: string
    location: string
    image_url: string
    secret_phrase: string
    society_hub: {
        id: string
        name: string
    }
    start_date: number | null
    end_date: number | null
    timezone: string
}

type BaseDynamicField = {
    title: string
    description: string
    type: string
    emoji: string
}
const isEmoji = (text: string) => {
    const emojiRegex = /\p{Emoji}/u
    return emojiRegex.test(text)
}

export const InputDynamicFieldSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.string(),
    emoji: z.string().min(1).refine(isEmoji, {
        message: 'Must be a valid emoji',
    }),
    placeholder: z.string(),
})

export type InputDynamicField = BaseDynamicField & {
    type: 'input'
    placeholder: string
}

export const ButtonDynamicFieldSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.string(),
    emoji: z.string().min(1).refine(isEmoji, {
        message: 'Must be a valid emoji',
    }),
    url: z.string().url(),
})

export type ButtonDynamicField = BaseDynamicField & {
    type: 'button'
    url: string
}

type DynamicField = InputDynamicField | ButtonDynamicField

export type CreateEventData = TRequiredEventFields & {
    dynamic_fields: DynamicField[]
}

export type ZodErrors = {
    [key: string]: string
}

export const DynamicFieldsSchema = z.array(
    z.object({
        id: z.number().optional(),
        title: z.string(),
        description: z.string(),
        type: z.string(),
        emoji: z.string(),
        placeholder: z.string().optional(),
        url: z.string().optional(),
    })
)

export const EventDataSchema = z.object({
    event_id: z.number().optional(),
    event_uuid: z.string().optional(),
    type: z.number(),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    location: z.string(),
    image_url: z.string(),
    society_hub: z.object({
        id: z.string(),
        name: z.string(),
    }),
    secret_phrase: z.string(),
    start_date: z.number(),
    end_date: z.number().nullable(),
    owner: z.number(),
    timezone: z.string(),
    dynamic_fields: DynamicFieldsSchema,
})

export type EventData = z.infer<typeof EventDataSchema>
export type DynamicFields = GetEventResponseType['dynamic_fields']
export type GetEventResponseType = NonNullable<
    Awaited<ReturnType<typeof serverClient.events.getEvent>>
>

export type GetVisitorsResponseType = NonNullable<
    Awaited<ReturnType<typeof serverClient.visitors.getAll>>
>

export const RequiredEventFieldsSchema = z
    .object({
        title: z.string().min(1, { message: 'Required' }),
        subtitle: z.string().min(1, { message: 'Required' }),
        description: z.string().min(1, { message: 'Required' }),
        location: z.string().min(1, { message: 'Required' }),
        image_url: z
            .string()
            .url()
            .refine((url) => url.includes('telegra.ph'), {
                message: "URL must be from the 'telegra.ph' domain",
            }),
        secret_phrase: z.string().optional(),
        start_date: z
            .number()
            .min(new Date('2023-01-01').getTime() / 1000)
            .max(new Date('2033-12-31').getTime() / 1000),
        end_date: z
            .number()
            .min(new Date('2023-01-01').getTime() / 1000)
            .max(new Date('2033-12-31').getTime() / 1000)
            .nullable()
            .optional(),
        timezone: z.string(),
    })
    .refine(
        (data) => {
            if (data.start_date && data.end_date) {
                return data.start_date <= data.end_date
            }
            return true
        },
        {
            message: 'Start date must be before end date',
            path: ['start_date', 'end_date'],
        }
    )

export type TRequiredEventFieldsSchema = z.infer<
    typeof RequiredEventFieldsSchema
>

// user_id: opts.input.user.id,
// username: opts.input.user.username,
// first_name: opts.input.user.first_name,
// last_name: opts.input.user.last_name,
// language_code: opts.input.user.language_code,

// make zod schema for user

export const UserSchema = z.object({
    id: z.number(),
    username: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    language_code: z.string(),
    role: z.string(),
    wallet_address: z.string().optional(),
})

export type TelegramInitDataJson = {
    query_id: string
    user: TelegramUser
    auth_date: string
    hash: string
    [key: string]: string | TelegramUser | undefined
}

export type TelegramUser = {
    id: number
    first_name: string
    last_name: string
    username: string
    language_code: string
    is_premium: boolean
    allows_write_to_pm: boolean
}
