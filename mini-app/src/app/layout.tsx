import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { GoogleTagManager } from '@next/third-parties/google'

import Providers from './providers'

import Script from 'next/script'
import Provider from './_trpc/Provider'
import UserSaver from './_components/UserSaver'
import { getAuthenticatedUser } from '@/server/auth'
import { db } from '@/db/db'
import { InferSelectModel } from 'drizzle-orm'
import { users } from '@/db/schema'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Onton',
    description: 'Events on TON',
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [userId] = getAuthenticatedUser()
    let user: InferSelectModel<typeof users> | undefined
    if (userId) {
        user = await db.query.users.findFirst({
            where(fields, { eq }) {
                return eq(fields.user_id, userId)
            },
        })
    }

    return (
        <html lang="en">
            {
                process.env.NODE_ENV === 'production' && (
                    <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM as string} />)
            }
            <Script src="https://telegram.org/js/telegram-web-app.js"></Script>
            <body className={inter.className}>
                <Provider>
                    <Providers>
                        <UserSaver user={user}>
                            <main className="p-4">
                                {children}
                            </main>
                        </UserSaver>
                    </Providers>
                </Provider>
            </body>
        </html>
    )
}
