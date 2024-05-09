'use client'

import useWebApp from '@/hooks/useWebApp'
import { MessageSquare } from 'lucide-react'
import React from 'react'

const SupportButton = () => {
    const WebApp = useWebApp()


    return (
        <div className='flex items-center justify-center text-[14px] text-secondary' onClick={
            () => {
                WebApp?.HapticFeedback.impactOccurred("medium")
                WebApp?.openTelegramLink('https://t.me/ontonsupport')
            }
        }>
            Support
            <MessageSquare className='w-[14px] text-secondary ml-1' />
        </div>
    )
}

export default SupportButton