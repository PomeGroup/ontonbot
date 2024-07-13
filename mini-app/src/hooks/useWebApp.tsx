import { retrieveLaunchParams, useMiniApp, usePopupRaw } from '@tma.js/sdk-react'
import { useEffect, useState } from 'react'

const useWebApp = () => {
    const [initData, setInitData] = useState<undefined | string>(undefined)
    const miniApp = useMiniApp(true)

    useEffect(() => {
        const checkWebApp = () => {
            if (typeof window !== 'undefined') {
                try {
                    const lunchParams = retrieveLaunchParams()
                    setInitData(lunchParams.initDataRaw)
                } catch (error) { }
            }
        }

        checkWebApp()

        const intervalId = setInterval(checkWebApp, 1000)

        return () => clearInterval(intervalId)
    }, [])

    return { ...miniApp, initData }
}

export default useWebApp
