import { db } from '@/db/db'
import { rewards } from '@/db/schema'
import { createUserRewardLink } from '@/lib/ton-society-api'
import axios, { AxiosError } from 'axios'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        await createRewards()
    } catch (error) {
        console.error('ERROR_IN_CREATE_REWARDS: ', error)
    }

    try {
        await notifyUsersForRewards()
    } catch (error) {
        console.error('ERROR_IN_NOTIFICATION: ', error)
    }

    return NextResponse.json({
        message: 'Cron job executed successfully',
        now: Date.now(),
    })
}

async function createRewards() {
    let pendingRewards = await db.query.rewards.findMany({
        where: (fields, { eq }) => {
            return eq(fields.status, 'pending_creation')
        },
    })

    console.log('pendingRewards', pendingRewards.length)

    // create reward ton society integration
    for (const pendingReward of pendingRewards) {
        try {
            const visitor = await db.query.visitors.findFirst({
                where: (fields, { eq }) => {
                    return eq(fields.id, pendingReward.visitor_id)
                },
            })

            const user = await db.query.users.findFirst({
                where: (fields, { eq }) => {
                    return eq(fields.user_id, visitor?.user_id as number)
                },
            })

            const event = await db.query.events.findFirst({
                where: (fields, { eq }) => {
                    return eq(fields.event_uuid, visitor?.event_uuid as string)
                },
            })

            const response = await createUserRewardLink(
                event?.activity_id as number,
                {
                    telegram_user_id: visitor?.user_id as number,
                    wallet_address: user?.wallet_address as string,
                    attributes: [
                        {
                            trait_type: 'Organizer',
                            value: event?.society_hub as string,
                        },
                    ],
                }
            )

            await db
                .update(rewards)
                .set({
                    status: 'created',
                    data: response.data.data,
                })
                .where(eq(rewards.id, pendingReward.id))
        } catch (error) {
            const isEventPublished =
                error instanceof AxiosError
                    ? error.response?.data?.message !== 'activity not found'
                    : true
            // if it was not published we will delete all the other rewards assosieted with this event from the loop
            if (!isEventPublished) {
                const visitor = await db.query.visitors.findFirst({
                    where: (fields, { eq }) => {
                        return eq(fields.id, pendingReward.visitor_id)
                    },
                })

                const unpublishedEvent = await db.query.events.findFirst({
                    where: (fields, { eq }) => {
                        return eq(
                            fields.event_uuid,
                            visitor?.event_uuid as string
                        )
                    },
                })
                pendingRewards = pendingRewards.filter(async (r) => {
                    const visitor = await db.query.visitors.findFirst({
                        where: (fields, { eq }) => {
                            return eq(fields.id, r.visitor_id)
                        },
                    })

                    const event = await db.query.events.findFirst({
                        where: (fields, { eq }) => {
                            return eq(
                                fields.event_uuid,
                                visitor?.event_uuid as string
                            )
                        },
                    })

                    return event?.activity_id !== unpublishedEvent?.activity_id
                })
            }

            const shouldFail = pendingReward.tryCount >= 5 && isEventPublished

            if (isEventPublished || shouldFail) {
                try {
                    await db
                        .update(rewards)
                        .set({
                            tryCount: isEventPublished
                                ? pendingReward.tryCount + 1
                                : undefined,
                            status: shouldFail ? 'failed' : undefined,
                            data: shouldFail
                                ? { fail_reason: error }
                                : undefined,
                        })
                        .where(eq(rewards.id, pendingReward.id))
                } catch (error) {
                    console.log('DB_ERROR_102', error)
                }
            }
            if (error instanceof AxiosError) {
                console.error(
                    'CRON_JOB_ERROR',
                    error.message,
                    error.response?.data
                )
            } else {
                console.error('CRON_JOB_ERROR', error)
            }
        }
    }
}

async function notifyUsersForRewards() {
    const createdRewards = await db.query.rewards.findMany({
        where: (fields, { eq }) => {
            return eq(fields.status, 'created')
        },
    })

    console.log('createdRewards ', createdRewards.length)

    for (const createdReward of createdRewards) {
        try {
            const visitor = await db.query.visitors.findFirst({
                where: (fields, { eq }) => {
                    return eq(fields.id, createdReward.visitor_id)
                },
            })

            const event = await db.query.events.findFirst({
                where: (fields, { eq }) => {
                    return eq(fields.event_uuid, visitor?.event_uuid as string)
                },
            })

            // send bot message to valid users
            await axios.post(`http://telegram-bot:3333/send-message`, {
                // @ts-expect-error
                link: createdReward.data.reward_link,
                chat_id: visitor?.user_id,
                custom_message: `Hey there, you just received your reward for ${event?.title} event. please click on the link below to claim it`,
            })

            await db
                .update(rewards)
                .set({
                    status: 'notified',
                })
                .where(eq(rewards.id, createdReward.id))
        } catch (error) {
            console.error('BOT_API_ERROR', error)
            const shouldFail = createdReward.tryCount >= 10

            try {
                db.update(rewards)
                    .set({
                        tryCount: createdReward.tryCount + 1,
                        status: shouldFail ? 'notification_failed' : undefined,
                        data: shouldFail ? { fail_reason: error } : undefined,
                    })
                    .where(eq(rewards.id, createdReward.id))
            } catch (error) {
                console.error('DB_ERROR_156', error)
            }
        }
    }
}

export const dynamic = 'force-dynamic'
