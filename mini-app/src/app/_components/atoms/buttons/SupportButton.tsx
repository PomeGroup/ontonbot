'use client'

import { useHapticFeedback, useUtils } from '@tma.js/sdk-react'
import { MessageSquare } from 'lucide-react'
import React from 'react'

const SupportButton = () => {
    const hapticfeedback = useHapticFeedback(true)
    const tmaUtils = useUtils(true)

    return (
        <div className='flex items-center justify-center text-[14px] text-secondary' onClick={
            () => {
                hapticfeedback?.impactOccurred("medium")
                tmaUtils?.openTelegramLink('https://t.me/ontonsupport')
            }
        }>
            Support
            <MessageSquare className='w-[14px] text-secondary ml-1' />
        </div>
    )
}

export default SupportButton
