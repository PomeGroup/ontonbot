import { db } from '@/db/db'
import { rewardType, rewards, users, visitors } from '@/db/schema'
import { validateMiniAppData } from '@/utils'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { initDataProtectedProcedure, publicProcedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { TRPC_ERROR_CODES_BY_KEY, TRPC_ERROR_CODES_BY_NUMBER } from '@trpc/server/rpc'
import { createUserRewardLinkInputZod } from '@/types/user.types'
import { createUserRewardLink } from '@/lib/ton-society-api'
import { selectVisitorById } from '../db/visitors'

export const usersRouter = router({
    validateUserInitData: publicProcedure
        .input(z.string())
        .query(async (opts) => {
            const data = validateMiniAppData(opts.input)
            return data
        }),

    haveAccessToEventAdministration: publicProcedure
        .input(z.string())
        .query(async (opts) => {
            if (!opts.input) {
                return undefined
            }

            try {
                const data = validateMiniAppData(opts.input)

                if (!data.valid) {
                    return false
                }

                const userRole = await db
                    .select({ role: users.role })
                    .from(users)
                    .where(eq(users.user_id, data.initDataJson.user.id))
                    .execute()

                if (
                    !userRole ||
                    (userRole[0].role !== 'admin' &&
                        userRole[0].role !== 'organizer')
                ) {
                    return false
                }

                return true
            } catch (error) {
                console.error(error)
            }
            return false
        }),

    // private
    addUser: publicProcedure
        .input(z.object({ initData: z.string() }))
        .mutation(async (opts) => {
            if (!opts.input.initData) {
                throw new TRPCError({
                    message: 'initdata is required',
                    code: 'BAD_REQUEST'
                })
            }

            const { valid, initDataJson } = validateMiniAppData(
                opts.input.initData
            )

            if (!valid) {
                throw new TRPCError({
                    message: 'invalid initdata',
                    code: 'UNPROCESSABLE_CONTENT'
                })
            }

            const data = await db
                .insert(users)
                .values({
                    user_id: initDataJson.user.id,
                    username: initDataJson.user.username,
                    first_name: initDataJson.user.first_name,
                    last_name: initDataJson.user.last_name,
                    language_code: initDataJson.user.language_code,
                    role: 'user',
                })
                .onConflictDoNothing()
                .execute()

            if (!data.length) {
                throw new TRPCError({
                    message: 'user already exists',
                    code: 'CONFLICT'
                })
            }

            return data
        }),

    // private
    getWallet: publicProcedure
        .input(z.object({ initData: z.string().optional() }))
        .query(async (opts) => {
            if (!opts.input.initData) {
                return
            }

            const { valid, initDataJson } = validateMiniAppData(
                opts.input.initData
            )

            if (!valid) {
                return
            }

            const res = await db
                .select({ wallet: users.wallet_address })
                .from(users)
                .where(eq(users.user_id, initDataJson.user.id))
                .execute()

            return res[0]?.wallet
        }),

    // private
    addWallet: publicProcedure
        .input(
            z.object({
                initData: z.string().optional(),
                wallet: z.string(),
            })
        )
        .mutation(async (opts) => {
            if (!opts.input.initData) {
                return
            }

            const { valid, initDataJson } = validateMiniAppData(
                opts.input.initData
            )

            if (!valid) {
                return
            }

            db.update(users)
                .set({
                    wallet_address: opts.input.wallet,
                })
                .where(eq(users.user_id, initDataJson.user.id))
                .execute()
        }),

    // private
    deleteWallet: publicProcedure
        .input(
            z.object({
                initData: z.string().optional(),
            })
        )
        .mutation(async (opts) => {
            if (!opts.input.initData) {
                return
            }

            const { valid, initDataJson } = validateMiniAppData(
                opts.input.initData
            )

            if (!valid) {
                return
            }

            db.update(users)
                .set({
                    wallet_address: null,
                })
                .where(eq(users.user_id, initDataJson.user.id))
                .execute()
        }),

    createUserReward: initDataProtectedProcedure
        .input(
            z.object({
                activity_id: z.number(),
                event_uuid: z.string().uuid(),
                data: createUserRewardLinkInputZod
            })
        )
        .mutation(async (opts) => {
            try {
                // Fetch the visitor from the database
                const visitor = await db.query.visitors.findFirst({
                    where(fields, { eq, and }) {
                        return and(
                            eq(fields.user_id, opts.ctx.parsedInitData.user.id),
                            eq(fields.event_uuid, opts.input.event_uuid)
                        )
                    },
                });

                // Check if visitor exists
                if (!visitor) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Visitor not found with the provided user ID and event UUID."
                    });
                }

                // Validate the visitor
                const isValidVisitor = await selectVisitorById(visitor.id, opts.input.event_uuid);
                if (!isValidVisitor) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Invalid visitor: please complete the tasks."
                    });
                }

                // Create the user reward link
                const res = await createUserRewardLink(opts.input.activity_id, opts.input.data);

                // Ensure the response contains data
                if (!res || !res.data || !res.data.data) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to create user reward link."
                    });
                }

                // Insert the reward into the database
                await db.insert(rewards).values({
                    visitor_id: visitor.id,
                    type: 'ton_society_sbt',
                    data: res.data.data,
                }).execute();

                return res.data.data;

            } catch (error) {
                console.error("Error in createUserReward mutation:", error);
                if (error instanceof TRPCError) {
                    throw error;
                } else {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "An unexpected error occurred while creating user reward."
                    });
                }
            }
        })
})
