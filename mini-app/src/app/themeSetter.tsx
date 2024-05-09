'use client'

import { useLayoutEffect } from 'react'
import { useTheme } from 'next-themes'
import useWebApp from '@/hooks/useWebApp'

export default function ThemeSetter({
    children,
}: {
    children: React.ReactNode
}) {
    const { theme, setTheme } = useTheme()
    const WebApp = useWebApp()

    useLayoutEffect(() => {
        if (!WebApp) {
            return
        }

        setTheme(WebApp.colorScheme)
        WebApp.setHeaderColor(theme === 'dark' ? '#1C1C1E' : '#ffffff')
        WebApp.setBackgroundColor(theme === 'dark' ? '#1C1C1E' : '#ffffff')
        WebApp?.HapticFeedback.impactOccurred('light')
        WebApp.expand()
    }, [theme, setTheme, WebApp])

    return <div>{children}</div>
}
