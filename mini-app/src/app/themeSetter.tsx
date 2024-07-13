'use client'

import { useLayoutEffect } from 'react'
import { useTheme } from 'next-themes'
import { useHapticFeedback, useMiniApp, useThemeParams, useViewport } from '@tma.js/sdk-react'

export default function ThemeSetter({
    children,
}: {
    children: React.ReactNode
}) {
    const { theme, setTheme } = useTheme()
    const themeParams = useThemeParams(true)
    const webApp = useMiniApp(true)
    const habticfeedback = useHapticFeedback(true)
    const viewport = useViewport(true)

    useLayoutEffect(() => {
        if (!themeParams) {
            return
        }

        setTheme('dark')
        webApp?.setHeaderColor(theme === 'dark' ? '#1C1C1E' : '#ffffff')
        webApp?.setBgColor(theme === 'dark' ? '#1C1C1E' : '#ffffff')
        habticfeedback?.impactOccurred('light')
        viewport?.expand()

    }, [theme, setTheme, themeParams, webApp])

    return <div>{children}</div>
}
