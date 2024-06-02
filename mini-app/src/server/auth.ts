import { verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'

export function getAuthenticatedUser(): [number, null] | [null, Response] {
    const userToken = cookies().get('token')

    if (!userToken) {
        return [null, Response.json({ error: 'Unauthorized' }, { status: 401 })]
    }

    try {
        // validate user token
        const validation = verify(
            userToken.value,
            process.env.BOT_TOKEN as string
        )

        if (typeof validation === 'string') {
            return [
                null,
                Response.json({ error: 'Unauthorized' }, { status: 401 }),
            ]
        }

        return [validation.id as number, null]
    } catch (err) {
        return [null, Response.json({ error: 'Unauthorized' }, { status: 401 })]
    }
}
