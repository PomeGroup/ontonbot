'use client'

import useWebApp from "@/hooks/useWebApp"
import { useEffect, useState } from "react"
import { trpc } from "../_trpc/client"
import MainButton from "./atoms/buttons/web-app/MainButton"

// Child component
function ClaimRewardButtonChild({ link }: { link: string }) {
    const webApp = useWebApp()

    function openRewardLink() {
        webApp?.openLink(link)
    }

    return <MainButton text="Claim Reward" onClick={openRewardLink} />
}

// Parent component
export function ClaimRewardButton(props: { eventId: string }) {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''
    const [rewardLink, setRewardLink] = useState<string | undefined>(undefined)
    
    const visitorReward = trpc.users.getVisitorReward.useQuery({ init_data: initData, event_uuid: props.eventId }, {
        enabled: !rewardLink
    })

    useEffect(() => {
        if (visitorReward.data?.data) {
            console.log({ rewardLink: visitorReward.data })
            setRewardLink(visitorReward.data.data as string)
        }
    }, [visitorReward.isSuccess, visitorReward.data?.data])

    if (!rewardLink) {
        return null
    }

    return <ClaimRewardButtonChild link={rewardLink} />
}
