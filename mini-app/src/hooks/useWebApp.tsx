import { isEmptyObject } from '@/utils'
import { retrieveLaunchParams } from '@tma.js/sdk-react'
import { useEffect, useState } from 'react'

const useWebApp = () => {
    const [webApp, setWebApp] = useState<WebApp>({} as WebApp)
    const [initData, setInitData] = useState<undefined | string>(undefined)

    useEffect(() => {
        const checkWebApp = () => {
            if (
                typeof window !== 'undefined' &&
                window.Telegram &&
                window.Telegram.WebApp
            ) {
                setWebApp(window.Telegram.WebApp)
                try {
                    const lunchParams = retrieveLaunchParams()
                    setInitData(lunchParams.initDataRaw)
                } catch (error) {}
            }
        }

        checkWebApp()

        const intervalId = setInterval(checkWebApp, 1000)

        return () => clearInterval(intervalId)
    }, [])

    if (isEmptyObject(webApp)) {
        return null
    }

    return { ...webApp, initData }
}

export default useWebApp
