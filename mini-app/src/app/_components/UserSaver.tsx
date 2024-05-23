'use client'

import { useLaunchParams } from '@tma.js/sdk-react'
import { FC, ReactNode, useEffect } from 'react'
import { trpc } from '../_trpc/client'

const UserSaver: FC<{ children: ReactNode }> = ({ children }) => {
    const initData = useLaunchParams().initDataRaw
    const userSaver = trpc.users.addUser.useMutation()

    useEffect(() => {
        if (!initData) return

        userSaver.mutateAsync({ initData })
    }, [initData])

    return <>{children}</>
}

export default UserSaver
