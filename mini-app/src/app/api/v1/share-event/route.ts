import { getAuthenticatedUser } from '@/server/auth'
import axios from 'axios'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest): Promise<Response> {
    const [, err] = getAuthenticatedUser()
    if (err && process.env.NODE_ENV === 'production') {
        return err
    }

    const event_uuid = req.nextUrl.searchParams.get('event_uuid')
    const user_id = req.nextUrl.searchParams.get('user_id')

    if (typeof user_id !== 'string' || typeof event_uuid !== 'string') {
        return Response.json({ message: 'invalid params' }, { status: 400 })
    }

    await axios.post(`http://telegram-bot:3333/share-event`, {
        user_id,
        id: event_uuid,
        url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/ptma/event/${event_uuid}`,
    })

    return Response.json({ message: 'share message sent successfully' })
}
