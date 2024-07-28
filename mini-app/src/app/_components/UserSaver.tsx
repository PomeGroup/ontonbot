'use client'

import useWebApp from '@/hooks/useWebApp'
import { FC, ReactNode, useEffect } from 'react'
import { trpc } from '../_trpc/client'
import { type InferSelectModel } from 'drizzle-orm'
import { users } from '@/db/schema'

const UserSaver: FC<{
    children: ReactNode
}> = ({ children }) => {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''
    const userSaver = trpc.users.addUser.useMutation()

    useEffect(() => {
        if (!initData) return

        userSaver.mutate({ initData })
    }, [initData])

    return <>{children}</>
}

export default UserSaver
