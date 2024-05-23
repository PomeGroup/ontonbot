import { trpc } from '@/app/_trpc/client'
import { useLaunchParams } from '@tma.js/sdk-react'
import { useEffect, useState } from 'react'

const useAuth = () => {
    const [authorized, setAuthorized] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const initData = useLaunchParams().initDataRaw

    const validateUserInitDataQuery =
        trpc.users.haveAccessToEventAdministration.useQuery(initData, {
            enabled: !!initData,
        })

    useEffect(() => {
        if (!initData) {
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
        initData,
        validateUserInitDataQuery.data,
        validateUserInitDataQuery.isLoading,
        validateUserInitDataQuery.isError,
    ])

    return { authorized, isLoading }
}

export default useAuth
