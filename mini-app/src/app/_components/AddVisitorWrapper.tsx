'use client'

import React, { FC, useLayoutEffect } from 'react'
import { trpc } from '../_trpc/client'
import useWebApp from '@/hooks/useWebApp'

const AddVisitorWrapper: FC<{ children: React.ReactNode; hash: string }> = ({
    children,
    hash,
}) => {
    const addVisitorMutation = trpc.visitors.add.useMutation()
    const WebApp = useWebApp()

    useLayoutEffect(() => {
        if (!hash) {
            return
        }

        async function addVisitor() {
            await addVisitorMutation.mutateAsync({
                initData: WebApp?.initData,
                event_uuid: hash,
            })
        }

        addVisitor()
    }, [hash, WebApp?.initData])

    return <>{children}</>
}

export default AddVisitorWrapper