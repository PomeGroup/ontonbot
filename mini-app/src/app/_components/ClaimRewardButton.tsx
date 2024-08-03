'use client'

import useWebApp from '@/hooks/useWebApp'
import { useEffect, useState } from 'react'
import { trpc } from '../_trpc/client'
import MainButton from './atoms/buttons/web-app/MainButton'
import ModalDialog from './SecretSavedModal'

// Child component
function ClaimRewardButtonChild(props: {
    link: string | null
    isNotified: boolean
}) {
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
            {!isRewardModalOpen && !props.isNotified && (
                <MainButton
                    text="Claim Reward"
                    onClick={openRewardLink}
                    color={'#2ea6ff'}
                />
            )}

            {props.isNotified && (
                <MainButton text="Claim Reward" color={'#747480'} />
            )}

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

    const visitorReward = trpc.users.getVisitorReward.useQuery(
        { init_data: initData, event_uuid: props.eventId },
        {
            enabled: !!initData && !!props.eventId,
            retry: false,
            queryKey: [
                'users.getVisitorReward',
                {
                    init_data: initData,
                    event_uuid: props.eventId,
                },
            ],
        }
    )

    // invalidate the query if the init data changed
    useEffect(() => {
        console.info('INITDATA:', initData);
        if (!initData) return
        visitorReward.refetch()
    }, [initData])

    return visitorReward.isSuccess ? (
        <ClaimRewardButtonChild
            isNotified={
                visitorReward.data.type === 'reward_link_generated' &&
                visitorReward.data.status === 'notified'
            }
            link={visitorReward.data.data}
        />
    ) : (
        <MainButton text="Fill The Form" color={'#747480'} />
    )
}
