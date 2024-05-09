'use client'

import { FC, ReactNode, useEffect, useMemo } from 'react'
import { trpc } from '../_trpc/client'
import useWebApp from '@/hooks/useWebApp'

const UserSaver: FC<{ children: ReactNode }> = ({ children }) => {
    const WebApp = useWebApp()
    const initData = WebApp?.initData
    const userSaver = trpc.users.addUser.useMutation()

    useEffect(() => {
        if (!initData) return

        userSaver.mutateAsync({ initData })
    }, [WebApp, initData])

    return <>{children}</>
}

export default UserSaver
