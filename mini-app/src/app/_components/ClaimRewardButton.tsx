import useWebApp from "@/hooks/useWebApp";
import { trpc } from "../_trpc/client";
import { useEffect } from "react";
import { useMainButton, useUtils } from "@tma.js/sdk-react";

export function ClaimRewardButton(props: { eventId: string }) {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''
    const visitorReward = trpc.users.getVisitorReward.useQuery({
        init_data: initData,
        event_uuid: props.eventId
    })

    const mainButton = useMainButton(true)
    const tmaUtils = useUtils(true)

    function openRewardLink() {
        tmaUtils?.openLink(visitorReward?.data?.data as string)
    }

    useEffect(() => {
        if (visitorReward.isSuccess) {
            mainButton?.setText("Claim Reward")
            mainButton?.on('click', openRewardLink)
            mainButton?.enable().show()
        }

        return () => {
            mainButton?.off('click', openRewardLink)
            mainButton?.hide().disable()
        }
    }, [visitorReward.isSuccess])

    return <></>
}


