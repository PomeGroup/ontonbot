import { db } from '@/db/db'
import { publicProcedure, router } from '../trpc'
import { userEventFields, eventFields, events } from '@/db/schema'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { validateMiniAppData } from '@/utils'

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
            })
        )
        .mutation(async (opts) => {
            if (!opts.input.initData) {
                return undefined;
            }

            const { valid, initDataJson } = validateMiniAppData(opts.input.initData);

            if (!valid) {
                throw new Error('Unauthorized access or invalid role');
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
                return undefined;
            }

            const { valid, initDataJson } = validateMiniAppData(opts.input.initData);

            if (!valid) {
                throw new Error('Unauthorized access or invalid role');
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
            z.object(
                {
                    initData: z.string().optional(),
                    event_hash: z.string()
                }
            )
        )
        .query(async (opts): Promise<GetUserEventFieldsReturnType | undefined> => {
            if (!opts.input.initData) {
                return undefined;
            }

            const { valid, initDataJson } = validateMiniAppData(opts.input.initData);

            if (!valid) {
                throw new Error('Unauthorized access or invalid role');
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

            if (!userEventFieldsResult || userEventFieldsResult.length === 0)
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
        }),
})
