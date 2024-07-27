'use client'

import Image from 'next/image'
import React from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useTheme } from 'next-themes'
import { cn } from '@/utils'

const GenericTask: React.FC<{
    title: string
    description: string
    completed: boolean | undefined
    defaultEmoji: string
    onClick?: (e: any) => void
    className?: string
}> = ({ title, description, completed, defaultEmoji, onClick, className }) => {
    const { theme } = useTheme()

    const bgColorClass = clsx({
        'bg-tertiary': !completed || theme !== 'light',
        'bg-[rgb(234,249,230)]': completed && theme === 'light',
    })

    return (
        <div
            className={cn(
                'my-4 rounded-[14px] p-4 border border-separator flex items-center justify-start cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            <div
                className={twMerge(
                    `rounded-lg mr-[10px] min-w-[40px] min-h-[40px] flex items-center justify-center`,
                    bgColorClass
                )}
            >
                {completed !== undefined &&
                    (completed === true ? (
                        <Image
                            className="fill-tertiary"
                            src="/checkmark.svg"
                            alt="checkmark"
                            width={16}
                            height={16}
                        />
                    ) : (
                        defaultEmoji
                    ))}
            </div>

            <div className="flex flex-col">
                <div className="text-[17px] font-medium leading-[22px]">
                    {title === 'secret_phrase_onton_input'
                        ? 'Secret Phrase'
                        : title}
                </div>
                <div className="text-secondary text-[14px] leading-none font-light">
                    {description}
                </div>
            </div>
        </div>
    )
}

export default GenericTask
