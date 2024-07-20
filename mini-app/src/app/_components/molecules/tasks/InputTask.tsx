'use client'

import { trpc } from '@/app/_trpc/client'
import useWebApp from '@/hooks/useWebApp'
import Image from 'next/image'
import React, {
    KeyboardEvent,
    MouseEvent,
    useEffect,
    useRef,
    useState,
} from 'react'
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
            WebApp?.initData || ''
        )
        const [inputText, setInputText] = useState(data)
        const [isCompleted, setIsCompleted] = useState(completed)
        const [isEditing, setIsEditing] = useState(false)
        const editingRef = useRef<HTMLDivElement>(null)
        const trpcUtils = trpc.useUtils()

        useEffect(() => {
            function handleClickOutside(
                this: Document,
                event: globalThis.MouseEvent
            ) {
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

        useEffect(() => {
            setIsCompleted(completed)
        }, [completed])

        const upsertUserEventFieldMutation =
            trpc.userEventFields.upsertUserEventField.useMutation({
                onError: () => {
                    hapticFeedback?.notificationOccurred('error')
                    // use toast instead of alert
                    WebApp?.showPopup({
                        message: "Wrong Secret Entered"
                    })
                },
                onSuccess: () => {
                    hapticFeedback?.notificationOccurred('success')
                    setIsCompleted(inputText ? true : false)
                    trpcUtils.userEventFields.invalidate()
                    trpcUtils.users.getVisitorReward.refetch()
                }
            })

        function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
            setInputText(e.target.value)
        }

        function handleConfirm(
            e: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLInputElement>
        ) {
            e.preventDefault()
            setIsEditing(false)

            if (!validatedData.data?.valid) {
                hapticFeedback?.notificationOccurred('error')
                return
            }

            upsertUserEventFieldMutation.mutate({
                initData: WebApp?.initData,
                field_id: fieldId,
                data: inputText || '',
                completed: inputText ? true : false,
                event_id: eventId,
            })

        }

        return (
            <div className="input-type-campaign-task">
                {!isEditing ? (
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
                    <div
                        className="my-4 rounded-[14px] p-4 border border-separator flex items-center justify-start"
                        ref={editingRef}
                    >
                        <input
                            className="w-full h-10 rounded-lg border border-separator p-2 mr-2"
                            type="text"
                            inputMode="text"
                            placeholder="Type something..."
                            value={inputText || ''}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirm(e)
                                }
                            }}
                            autoFocus
                        />
                        <button
                            onClick={handleConfirm}
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
                    </div>
                )}
            </div>
        )
    }

export default InputTypeCampaignTask
