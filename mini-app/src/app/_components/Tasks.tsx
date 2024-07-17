'use client'

import useWebApp from '@/hooks/useWebApp'
import { DynamicFields } from '@/types'
import { FC } from 'react'
import { trpc } from '../_trpc/client'
import Tasks from './molecules/tasks'

const AllTasks: FC<{
    tasks: DynamicFields
    eventHash: string
}> = ({ tasks, eventHash }) => {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''
    const userEventFieldsQuery = trpc.userEventFields.getUserEventFields.useQuery({
        initData,
        event_hash: eventHash,
    })
    const userEventFields = userEventFieldsQuery.data

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
                            eventId={task.event_id!}
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
                                eventId={task.event_id!}
                            />
                        </div>
                    )
                }
            })}
        </div>
    )
}

export default AllTasks
