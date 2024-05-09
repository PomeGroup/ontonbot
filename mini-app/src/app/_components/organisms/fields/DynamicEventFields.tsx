'use client'

import React, { Dispatch, FC, SetStateAction } from 'react'
import { FieldElement } from '@/types'
import { Trash } from 'lucide-react'
import Tasks from '../../molecules/tasks'

const DynamicCreateEventFields: FC<{
    fields: Array<FieldElement>
    setFields: Dispatch<SetStateAction<FieldElement[]>>
}> = ({ fields, setFields }) => {
    function handleDelete(index: number) {
        const values = [...fields]
        values.splice(index, 1)
        setFields(values)
    }

    return (
        <div className="flex flex-col gap-4 my-4">
            {fields.map((field, index) => {
                return (
                    <div
                        key={index}
                        className="flex gap-2 justify-center items-center"
                    >
                        <Tasks.Generic
                            className="flex-1 my-0"
                            {...field}
                            completed={false}
                            title={field.type + ': ' + field.title}
                            description={field.description}
                            defaultEmoji={field.emoji}
                        />
                        <div onClick={() => handleDelete(index)}>
                            <Trash />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default DynamicCreateEventFields
