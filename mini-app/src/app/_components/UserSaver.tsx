'use client'

import useWebApp from '@/hooks/useWebApp'
import { FC, ReactNode, useEffect } from 'react'
import { trpc } from '../_trpc/client'

const UserSaver: FC<{ children: ReactNode }> = ({ children }) => {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''
    const userSaver = trpc.users.addUser.useMutation()

    useEffect(() => {
        if (!initData) return

        userSaver.mutateAsync({ initData })
    }, [initData])

    return <>{children}</>
}

export default UserSaver
