'use client'

import { trpc } from '@/app/_trpc/client'
import useWebApp from '@/hooks/useWebApp'
import React from 'react'
import GenericTask from './GenericTask'

const ButtonTask: React.FC<{
    title: string
    description: string
    defaultEmoji: string
    url: string
    completed: boolean
    fieldId: number
    eventId: number
}> = ({
    title,
    description,
    defaultEmoji,
    url,
    completed,
    fieldId,
    eventId,
}) => {
        const webApp = useWebApp()
        const trpcUtils = trpc.useUtils()
        const upsertUserEventFieldMutation =
            trpc.userEventFields.upsertUserEventField.useMutation({
                onSuccess() {
                    trpcUtils.userEventFields.invalidate()
                    trpcUtils.users.getVisitorReward.invalidate({}, {refetchType: "all"})
                },
            })

        const [completedInternal, setCompletedInternal] = React.useState(completed)

        const handleConfirm = (e: any) => {
            e.stopPropagation()

            webApp?.openLink(url)

            if (webApp?.initData) {
                upsertUserEventFieldMutation.mutate({
                    init_data: webApp.initData,
                    field_id: fieldId,
                    data: '',
                    event_id: eventId,
                })
            }

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
