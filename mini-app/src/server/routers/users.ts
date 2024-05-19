import { db } from '@/db/db'
import { users } from '@/db/schema'
import { validateMiniAppData } from '@/utils'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

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
                return
            }

            const { valid, initDataJson } = validateMiniAppData(
                opts.input.initData
            )

            if (!valid) {
                return
            }

            return await db
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
})
