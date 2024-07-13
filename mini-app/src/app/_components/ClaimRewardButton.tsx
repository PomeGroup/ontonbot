'use client'

import useWebApp from "@/hooks/useWebApp";
import { trpc } from "../_trpc/client";
import { useEffect, useState } from "react";
import { useMainButton, useUtils } from "@tma.js/sdk-react";

export function ClaimRewardButton(props: { eventId: string }) {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''
    const visitorReward = trpc.users.getVisitorReward.useQuery({ init_data: initData, event_uuid: props.eventId })
    const mainButton = useMainButton(true)
    const tmaUtils = useUtils(true)
    const [rewardLink, setRewardLink] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (visitorReward.isSuccess && visitorReward.data?.data) {
            setRewardLink(visitorReward.data.data as string)
        }
    }, [visitorReward.isSuccess, visitorReward.data?.data])

    function openRewardLink() {
        console.log({ rewardLink })
        if (rewardLink) {
            tmaUtils?.openLink(rewardLink)
        }
    }

    useEffect(() => {
        if (rewardLink) {
            mainButton?.setText("Claim Reward")
            mainButton?.on('click', openRewardLink)
            mainButton?.enable().show()
        }

        return () => {
            mainButton?.off('click', openRewardLink)
            mainButton?.hide().disable()
        }
    }, [rewardLink, mainButton])

    return null
}
