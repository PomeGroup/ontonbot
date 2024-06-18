import { getAuthenticatedUser } from '@/server/auth'
import axios from 'axios'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest): Promise<Response> {
    console.log(req.nextUrl)
    const [, err] = getAuthenticatedUser()
    if (err) {
        return err
    }

    const event_uuid = req.nextUrl.searchParams.get('event_uuid')
    const user_id = req.nextUrl.searchParams.get('user_id')

    if (typeof user_id !== 'string' || typeof event_uuid !== 'string') {
        return Response.json({ message: 'invalid params' }, { status: 400 })
    }

    await axios.get(`http://telegram-bot:3333/share-event`, {
        params: {
            user_id,
            id: event_uuid,
            url: `${req.nextUrl.origin}/ptma/event/598729cf-f4b8-45da-afef-9a1dbeaf28e5`,
        },
    })

    return Response.json({ message: 'share message sent successfully' })
}
