// InputTypeCampaignTask.tsx

'use client'

import { trpc } from '@/app/_trpc/client'
import useWebApp from '@/hooks/useWebApp'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import GenericTask from './GenericTask'

const InputTypeCampaignTask: React.FC<{
    title: string
    description: string
    completed: boolean
    defaultEmoji: string
    data: string | null
    fieldId: number
    eventId: number
}> = ({
    title,
    description,
    completed,
    defaultEmoji,
    data,
    fieldId,
    eventId,
}) => {
    const WebApp = useWebApp()
    const hapticFeedback = WebApp?.HapticFeedback
    const validatedData = trpc.users.validateUserInitData.useQuery(
        WebApp?.initData || '',
        {
            queryKey: ['users.validateUserInitData', WebApp?.initData || ''],
        }
    )
    const [inputText, setInputText] = useState(data)
    const [isCompleted, setIsCompleted] = useState(completed)
    const [isEditing, setIsEditing] = useState(false)
    const editingRef = useRef<HTMLFormElement>(null)
    const trpcUtils = trpc.useUtils()
    const isSecretPhrase = title === 'secret_phrase_onton_input'

    if (isSecretPhrase && isCompleted) {
        description = 'Your secret phrase is saved'
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                editingRef.current &&
                !editingRef.current.contains(event.target as Node)
            ) {
                hapticFeedback?.notificationOccurred('error')
                setIsEditing(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    useEffect(() => {
        setInputText(data)
    }, [data])

    const upsertUserEventFieldMutation =
        trpc.userEventFields.upsertUserEventField.useMutation({
            onError: (error) => {
                hapticFeedback?.notificationOccurred('error')
                WebApp?.showPopup({
                    message: error.message,
                })
                setIsCompleted(false)
            },
            onSuccess: () => {
                hapticFeedback?.notificationOccurred('success')
                setIsCompleted(true)
                trpcUtils.userEventFields.invalidate()
                trpcUtils.users.getVisitorReward.invalidate(
                    {},
                    { refetchType: 'all' }
                )
            },
        })

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setInputText(e.target.value)
    }

    const handleConfirm: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        setIsEditing(false)

        if (!validatedData.data?.valid) {
            hapticFeedback?.notificationOccurred('error')
            return
        }

        if (inputText && WebApp?.initData) {
            upsertUserEventFieldMutation.mutate({
                init_data: WebApp?.initData,
                field_id: fieldId,
                data: inputText,
                event_id: eventId,
            })
        } else {
            WebApp?.showPopup({
                message: 'No input provided',
            })
        }
    }

    return (
        <div className="input-type-campaign-task">
            {!isEditing || isCompleted ? (
                <div
                    onClick={() => {
                        hapticFeedback?.impactOccurred('medium')
                        setIsEditing(true)
                    }}
                >
                    <GenericTask
                        title={title}
                        description={description}
                        completed={isCompleted}
                        defaultEmoji={defaultEmoji}
                    />
                </div>
            ) : (
                <form
                    className="my-4 rounded-[14px] p-4 border border-separator flex items-center justify-start"
                    ref={editingRef}
                    onSubmit={handleConfirm}
                >
                    <input
                        className="w-full h-10 rounded-lg border border-separator p-2 mr-2"
                        type="text"
                        inputMode="text"
                        placeholder="Type something..."
                        value={inputText || ''}
                        onChange={handleInputChange}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className={`rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center bg-tertiary`}
                    >
                        <Image
                            className="fill-tertiary"
                            src="/checkmark.svg"
                            alt="checkmark"
                            width={16}
                            height={16}
                        />
                    </button>
                </form>
            )}
        </div>
    )
}

export default InputTypeCampaignTask
