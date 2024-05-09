import { trpc } from '@/app/_trpc/client'
import { useEffect, useState } from 'react'

const useAuth = () => {
    const [authorized, setAuthorized] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    let WebApp = {
        initData: '',
    } as WebApp

    if (
        typeof window !== 'undefined' &&
        window.Telegram &&
        window.Telegram.WebApp
    ) {
        WebApp = window.Telegram.WebApp
    }

    const validateUserInitDataQuery =
        trpc.users.haveAccessToEventAdministration.useQuery(WebApp.initData, {
            enabled: !!WebApp.initData,
        })

    useEffect(() => {
        if (!WebApp.initData) {
            setIsLoading(false)
            return
        }

        if (
            validateUserInitDataQuery.isLoading ||
            validateUserInitDataQuery.isError
        ) {
            setIsLoading(true)
            return
        }

        setAuthorized(validateUserInitDataQuery.data!)
        setIsLoading(false)
    }, [
        WebApp.initData,
        validateUserInitDataQuery.data,
        validateUserInitDataQuery.isLoading,
        validateUserInitDataQuery.isError,
    ])

    return { authorized, isLoading }
}

export default useAuth
