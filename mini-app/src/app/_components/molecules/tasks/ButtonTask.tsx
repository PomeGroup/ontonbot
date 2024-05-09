'use client'

import React from 'react'
import useWebApp from '@/hooks/useWebApp'
import { trpc } from '@/app/_trpc/client'
import GenericTask from './GenericTask'

const ButtonTask: React.FC<{
    title: string
    description: string
    defaultEmoji: string
    url: string
    completed: boolean
    fieldId: number
}> = ({ title, description, defaultEmoji, url, completed, fieldId }) => {
    const WebApp = useWebApp()
    const validatedData = trpc.users.validateUserInitData.useQuery(
        WebApp?.initData || ''
    )
    const upsertUserEventFieldMutation =
        trpc.userEventFields.upsertUserEventField.useMutation()

    const [completedInternal, setCompletedInternal] = React.useState(completed)

    const handleConfirm = (e: any) => {
        e.stopPropagation()

        WebApp?.openLink(url)

        upsertUserEventFieldMutation.mutate({
            initData: WebApp?.initData,
            field_id: fieldId,
            data: '',
            completed: true,
        })

        setCompletedInternal(true)
    }

    return (
        <GenericTask
            title={title}
            description={description}
            completed={completed || completedInternal}
            defaultEmoji={defaultEmoji}
            onClick={handleConfirm}
        />
    )
}

export default ButtonTask
