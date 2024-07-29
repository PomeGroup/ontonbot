import { db } from '@/db/db'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { rewards } from '@/db/schema'
import { createUserRewardLink } from '@/lib/ton-society-api'
import axios from 'axios'

export async function GET() {
    const pendingRewards = await db.query.rewards.findMany({
        where: (fields, { eq }) => {
            return eq(fields.status, 'pending_creation')
        },
    })

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

            // send bot message to valid users
            axios
                .post(`http://telegram-bot:3333/send-message`, {
                    link: response.data.data.reward_link,
                    chat_id: user?.user_id,
                    custom_message:
                        'Hey there, you just received your reward. please click on the link below to claim it',
                })
                .catch((error) => {
                    console.error('BOT_API_ERROR', error)
                })

            await db
                .update(rewards)
                .set({
                    status: 'created',
                    data: response.data.data,
                })
                .where(eq(rewards.id, pendingReward.id))
                .execute()
        } catch (error) {
            db.update(rewards)
                .set({
                    tryCount: pendingReward.tryCount + 1,
                })
                .where(eq(rewards.id, pendingReward.id))
                .execute()
                .catch((error) => console.error('DB_ERROR: ', error))

            console.error('CRON_JOB_ERROR', error)
        }
    }

    return NextResponse.json({
        message: 'Cron job executed successfully',
        now: Date.now(),
    })
}

export const dynamic = 'force-dynamic'
