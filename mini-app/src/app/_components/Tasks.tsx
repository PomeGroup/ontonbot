'use client'

import { DynamicFields } from '@/types'
import React, { FC } from 'react'
import useWebApp from '@/hooks/useWebApp'
import { trpc } from '../_trpc/client'
import Tasks from './molecules/tasks'

const AllTasks: FC<{
    tasks: DynamicFields
    eventHash: string
}> = ({ tasks, eventHash }) => {
    const WebApp = useWebApp()
    const validatedData = trpc.users.validateUserInitData.useQuery(
        WebApp?.initData || ''
    )

    const userId = validatedData.data?.initDataJson?.user?.id || -1

    const userEventFields = trpc.userEventFields.getUserEventFields.useQuery({
        initData: WebApp?.initData,
        event_hash: eventHash,
    }).data

    return (
        <div>
            {tasks.map((task, index) => {
                const userEventField = userEventFields
                    ? userEventFields[task.id]
                    : undefined

                if (task.type === 'input') {
                    return (
                        <Tasks.Input
                            key={index}
                            title={task.title!}
                            description={task.description!}
                            completed={userEventField?.completed || false}
                            defaultEmoji={task.emoji!}
                            data={userEventField?.data || null}
                            fieldId={task.id}
                        />
                    )
                }

                if (task.type === 'button') {
                    return (
                        <div key={index}>
                            <Tasks.Button
                                title={task.title!}
                                description={task.description!}
                                completed={userEventField?.completed || false}
                                defaultEmoji={task.emoji!}
                                url={task.placeholder!}
                                fieldId={task.id}
                            />
                        </div>
                    )
                }
            })}
        </div>
    )
}

export default AllTasks
