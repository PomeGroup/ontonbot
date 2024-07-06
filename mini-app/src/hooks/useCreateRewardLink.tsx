import { trpc } from "@/app/_trpc/client"
import useWebApp from "./useWebApp"
import { useEffect } from "react"

export function useCreateRewardLink(props: { eventHash: string }) {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''

    const trpcUtils = trpc.useUtils()
    const createRewardLink = trpc.users.createUserReward.useMutation({
        onSuccess: () => {
            trpcUtils.users.getVisitorReward.invalidate()
        }
    })

    useEffect(() => {
        if (!initData) return
        createRewardLink.mutate({ init_data: initData, event_uuid: props.eventHash })
    }, [initData])
}
