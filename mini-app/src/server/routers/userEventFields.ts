import { db } from '@/db/db'
import { eventFields, events, userEventFields } from '@/db/schema'
import { validateMiniAppData } from '@/utils'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { TRPC_ERROR_CODES_BY_NUMBER } from '@trpc/server/http'

interface UserEventField {
    id: number
    event_field_id: number
    user_id: number
    data: string
    completed: boolean
    created_at: Date
}

type GetUserEventFieldsReturnType = Record<number, UserEventField>

export const userEventFieldsRouter = router({
    // protect
    upsertUserEventField: publicProcedure
        .input(
            z.object({
                initData: z.string().optional(),
                data: z.string(),
                completed: z.boolean(),
                field_id: z.number(),
                event_id: z.number(),
            })
        )
        .mutation(async (opts) => {
            if (!opts.input.initData) {
                return undefined
            }

            const { valid, initDataJson } = validateMiniAppData(
                opts.input.initData
            )

            if (!valid) {
                throw new Error('Unauthorized access or invalid role')
            }

            const eventData = await db
                .select()
                .from(events)
                .where(and(eq(events.event_id, opts.input.event_id)))
                .execute()

            if (eventData.length === 0) {
                throw new TRPCError({
                    message: 'Event not found',
                    code: 'BAD_REQUEST',
                })
            }
            const startDate = Number(eventData[0].start_date) * 1000
            const endDate = Number(eventData[0].end_date) * 1000

            if (Date.now() < startDate || Date.now() > endDate) {
                throw new TRPCError({
                    message: 'Event is not active',
                    code: 'FORBIDDEN',
                })
            }

            const userField = (await db
                .select({ data: userEventFields.data })
                .from(userEventFields)
                .leftJoin(eventFields,
                    and(
                        eq(eventFields.title, "Secret Phrase"),
                        eq(eventFields.id, opts.input.field_id),
                    )
                )
                .where(
                    and(
                        eq(userEventFields.event_field_id, opts.input.field_id),
                        eq(userEventFields.user_id, initDataJson.user.id)
                    )
                )).pop()

            if (eventData[0].secret_phrase !== opts.input.data) {
                throw new TRPCError(
                    {
                        message: "wrong secret phrase entered",
                        code: TRPC_ERROR_CODES_BY_NUMBER['-32003']
                    }
                )
            }

            const res = await db
                .insert(userEventFields)
                .values({
                    user_id: initDataJson.user.id,
                    event_field_id: opts.input.field_id,
                    data: opts.input.data,
                    completed: opts.input.completed,
                    created_at: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        userEventFields.user_id,
                        userEventFields.event_field_id,
                    ],
                    set: {
                        data: opts.input.data,
                        completed: opts.input.completed,
                    },
                })
                .execute()

            return res
        }),

    // protect
    // TODO: WHY WE DO NOT USE THIS?
    deleteUserEventField: publicProcedure
        .input(
            z.object({
                initData: z.string().optional(),
                id: z.number(),
            })
        )
        .mutation(async (opts) => {
            if (!opts.input.initData) {
                return undefined
            }

            const { valid, initDataJson } = validateMiniAppData(
                opts.input.initData
            )

            if (!valid) {
                throw new Error('Unauthorized access or invalid role')
            }

            await db
                .delete(userEventFields)
                .where(
                    and(
                        eq(userEventFields.id, opts.input.id),
                        eq(userEventFields.user_id, initDataJson.user.id)
                    )
                )
                .execute()
        }),

    // protect
    getUserEventFields: publicProcedure
        .input(
            z.object({
                initData: z.string().optional(),
                event_hash: z.string(),
            })
        )
        .query(
            async (opts): Promise<GetUserEventFieldsReturnType | undefined> => {
                if (!opts.input.initData) {
                    return undefined
                }

                const { valid, initDataJson } = validateMiniAppData(
                    opts.input.initData
                )

                if (!valid) {
                    throw new Error('Unauthorized access or invalid role')
                }

                const userEventFieldsResult = await db
                    .select({
                        eventFieldId: userEventFields.event_field_id,
                        userData: userEventFields.data,
                        completed: userEventFields.completed,
                        createdAt: userEventFields.created_at,
                        // Add other fields from userEventFields as necessary
                    })
                    .from(events)
                    .innerJoin(
                        eventFields,
                        eq(eventFields.event_id, events.event_id)
                    )
                    .leftJoin(
                        userEventFields,
                        and(
                            eq(userEventFields.event_field_id, eventFields.id),
                            eq(userEventFields.user_id, initDataJson.user.id)
                        )
                    )
                    .where(eq(events.event_uuid, opts.input.event_hash))
                    .execute()

                if (
                    !userEventFieldsResult ||
                    userEventFieldsResult.length === 0
                )
                    return {}

                const data = userEventFieldsResult.reduce((acc, field) => {
                    // @ts-expect-error here something bad
                    acc[field.eventFieldId] = {
                        id: field.eventFieldId,
                        event_field_id: field.eventFieldId,
                        user_id: initDataJson.user.id,
                        data: field.userData,
                        completed: field.completed,
                        created_at: field.createdAt,
                        // Map other necessary fields from userEventFields
                    }
                    return acc
                }, {})

                return data
            }
        ),
})
