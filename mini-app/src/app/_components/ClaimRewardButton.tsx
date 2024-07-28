'use client'

import useWebApp from '@/hooks/useWebApp'
import { useEffect, useState } from 'react'
import { trpc } from '../_trpc/client'
import MainButton from './atoms/buttons/web-app/MainButton'
import ModalDialog from './SecretSavedModal'

// Child component
function ClaimRewardButtonChild(props: { link: string | null }) {
    const webApp = useWebApp()
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)

    function openRewardLink() {
        if (props.link) {
            webApp?.openLink(props.link)
        } else {
            setIsRewardModalOpen(true)
        }
    }

    return (
        <>
            <MainButton text="Claim Reward" onClick={openRewardLink} />
            <ModalDialog
                isVisible={isRewardModalOpen}
                onClose={() => setIsRewardModalOpen(false)}
                description="We successfully collected your data, you'll receive your reward link through a bot message."
                closeButtonText="Back to ONTON"
                icon="/checkmark.svg"
            />
        </>
    )
}

// Parent component
export function ClaimRewardButton(props: { eventId: string }) {
    const WebApp = useWebApp()
    const initData = WebApp?.initData || ''
    const [rewardLink, setRewardLink] = useState<string | undefined>(undefined)

    const visitorReward = trpc.users.getVisitorReward.useQuery(
        { init_data: initData, event_uuid: props.eventId },
        {
            enabled: !rewardLink && !!initData && !!props.eventId,
            queryKey: [
                'users.getVisitorReward',
                {
                    init_data: initData,
                    event_uuid: props.eventId,
                },
            ],
            onSuccess: (data) => {
                if (data.type === 'reward_link_generated') {
                    setRewardLink(visitorReward.data?.data as string)
                }
            },
        }
    )

    return (
        visitorReward.isSuccess && (
            <ClaimRewardButtonChild link={visitorReward.data.data} />
        )
    )
}
