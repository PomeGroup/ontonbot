import { db } from '@/db/db'
import { eventFields, events, userEventFields } from '@/db/schema'
import { validateMiniAppData } from '@/utils'
import { TRPCError } from '@trpc/server'
import { TRPC_ERROR_CODES_BY_NUMBER } from '@trpc/server/http'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { initDataProtectedProcedure, publicProcedure, router } from '../trpc'

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
    upsertUserEventField: initDataProtectedProcedure
        .input(
            z.object({
                data: z.string(),
                field_id: z.number(),
                event_id: z.number(),
            })
        )
        .mutation(async (opts) => {
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

            // Check if eventFields were not found
            const eventSecretField =
                (
                    await db
                        .select({ id: eventFields.id })
                        .from(eventFields)
                        .where(
                            and(
                                eq(
                                    eventFields.title,
                                    'secret_phrase_onton_input'
                                ),
                                eq(eventFields.id, opts.input.field_id)
                            )
                        )
                ).length > 0

            if (
                eventSecretField &&
                !!eventData[0].secret_phrase &&
                eventData[0].secret_phrase?.toLowerCase().trim() !==
                    opts.input.data?.toLowerCase().trim()
            ) {
                throw new TRPCError({
                    message:
                        'Sorry, you entered the wrong secret phrase. Try again.',
                    code: TRPC_ERROR_CODES_BY_NUMBER['-32003'],
                })
            }

            const res = await db
                .insert(userEventFields)
                .values({
                    user_id: opts.ctx.user.user_id,
                    event_id: opts.input.event_id,
                    event_field_id: opts.input.field_id,
                    data: opts.input.data,
                    completed: true,
                    created_at: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        userEventFields.user_id,
                        userEventFields.event_field_id,
                    ],
                    set: {
                        data: opts.input.data,
                        completed: true,
                    },
                })
                .returning()
                .execute()

            return res
        }),

    // protect
    getUserEventFields: publicProcedure
        .input(
            z.object({
                initData: z.string().optional(),
                event_hash: z.string(),
            })
        )
        .query(async (opts) => {
            try {
                if (!opts.input.initData) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'initData is required',
                    })
                }

                const { valid, initDataJson } = validateMiniAppData(
                    opts.input.initData
                )

                if (!valid) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'Unauthorized access or invalid role',
                    })
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
                ) {
                    return {}
                }

                const data: { [key: string]: EventFieldData } = {}

                for (const field of userEventFieldsResult) {
                    data[field.eventFieldId ?? 'unknown'] = {
                        id: field.eventFieldId ?? 'unknown',
                        event_field_id: field.eventFieldId ?? 'unknown',
                        user_id: initDataJson.user.id,
                        data: field.userData ?? null,
                        completed: field.completed ?? false,
                        created_at: field.createdAt ?? null,
                        // Map other necessary fields from userEventFields
                    }
                }

                return data
            } catch (error) {
                console.error('Error in getUserEventFields query:', error)

                if (error instanceof TRPCError) {
                    throw error
                } else {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'An unexpected error occurred while retrieving user event fields',
                    })
                }
            }
        }),
})

interface EventFieldData {
    id: number | string
    event_field_id: number | string
    user_id: number
    data: any
    completed: boolean
    created_at: Date | null
    // Add other necessary fields from userEventFields
}
