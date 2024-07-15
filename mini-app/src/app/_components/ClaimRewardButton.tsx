'use client'

import useWebApp from "@/hooks/useWebApp";
import { trpc } from "../_trpc/client";
import { useEffect, useState } from "react";
import { useUtils } from "@tma.js/sdk-react";
import MainButton from "./atoms/buttons/web-app/MainButton";

// Child component
function ClaimRewardButtonChild({ link }: { link: string }) {
    const tmaUtils = useUtils(true)

    function openRewardLink() {
        tmaUtils?.openLink(link)
    }

    return <MainButton text="Claim Reward" onClick={openRewardLink} />
}

// Parent component
export function ClaimRewardButton(props: { eventId: string }) {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''
    const visitorReward = trpc.users.getVisitorReward.useQuery({ init_data: initData, event_uuid: props.eventId })
    const [rewardLink, setRewardLink] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (visitorReward.isSuccess && visitorReward.data?.data) {
            console.log({ rewardLink: visitorReward.data })
            setRewardLink(visitorReward.data.data as string)
        }
    }, [visitorReward.isSuccess, visitorReward.data?.data])

    if (!rewardLink) {
        return null
    }

    return <ClaimRewardButtonChild link={rewardLink} />
}
