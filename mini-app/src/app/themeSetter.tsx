'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { initViewport, useHapticFeedback, useMiniApp, useThemeParams } from '@tma.js/sdk-react'

export default function ThemeSetter({
    children,
}: {
    children: React.ReactNode
}) {
    const { theme, setTheme } = useTheme()
    const themeParams = useThemeParams(true)
    const webApp = useMiniApp(true)
    const habticfeedback = useHapticFeedback(true)

    useEffect(() => {
        async function viewport() {
            try {
                const [res] = initViewport()
                const vp = await res
                !vp.isExpanded && vp.expand()
            } catch (error
            ) {
                console.error(error)
            }
        }

        typeof window !== 'undefined' && viewport()

        if (!themeParams) {
            return
        }

        setTheme('dark')
        webApp?.setHeaderColor(theme === 'dark' ? '#1C1C1E' : '#ffffff')
        webApp?.setBgColor(theme === 'dark' ? '#1C1C1E' : '#ffffff')
        habticfeedback?.impactOccurred('light')

    }, [theme, setTheme, themeParams, webApp])

    return <div>{children}</div>
}
