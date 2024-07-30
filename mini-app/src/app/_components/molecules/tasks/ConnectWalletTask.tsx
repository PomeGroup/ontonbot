'use client'

import { trpc } from '@/app/_trpc/client'
import useWebApp from '@/hooks/useWebApp'
import {
    useTonAddress,
    useTonConnectUI,
    useTonWallet,
} from '@tonconnect/ui-react'
import { useEffect, useMemo, useState } from 'react'
import { Address } from '@ton/core'
import Tasks from '.'

const ConnectWalletTask = () => {
    const WebApp = useWebApp()
    const wallet = useTonWallet()
    const [tonConnectUI] = useTonConnectUI()
    const trpcUtils = trpc.useUtils()
    const addWalletMutation = trpc.users.addWallet.useMutation({
        onSuccess: () => {
            trpcUtils.users.getVisitorReward.invalidate(
                {},
                { refetchType: 'all' }
            )
        },
    })

    const friendlyAddress = useMemo(() => {
        return Address.parse(tonConnectUI.account?.address as string).toString()
    }, [tonConnectUI.account?.address])

    const userAddress = trpc.users.getWallet.useQuery(
        {
            initData: WebApp?.initData,
        },
        {
            queryKey: [
                'users.getWallet',
                {
                    initData: WebApp?.initData,
                },
            ],
        }
    ).data
    const webApp = useWebApp()
    const hapticFeedback = webApp?.HapticFeedback

    const [isWalletConnected, setIsWalletConnected] = useState<
        boolean | undefined
    >(undefined)

    useEffect(() => {
        setIsWalletConnected(
            wallet !== null ||
                (userAddress !== '' &&
                    userAddress !== null &&
                    userAddress !== undefined)
        )
    }, [wallet, userAddress])

    useEffect(() => {
        if (isWalletConnected && friendlyAddress !== '') {
            addWalletMutation.mutate({
                initData: WebApp?.initData,
                wallet: friendlyAddress,
            })

            return
        }
    }, [isWalletConnected, friendlyAddress])

    const onConnectClick = async () => {
        hapticFeedback?.impactOccurred('medium')

        if (!tonConnectUI.account) {
            await tonConnectUI.openModal()
        }
    }

    const connectedWallet = useMemo(() => {
        return friendlyAddress.slice(0, 4) + '...' + friendlyAddress.slice(-4)
    }, [friendlyAddress])

    return (
        <>
            <Tasks.Generic
                title="Connect TON Wallet"
                description={
                    !isWalletConnected
                        ? 'Register at event and receive an SBT'
                        : `You have connected your wallet (${connectedWallet})`
                }
                completed={isWalletConnected}
                defaultEmoji="👛"
                onClick={(!isWalletConnected && onConnectClick) || undefined}
            />
        </>
    )
}

export default ConnectWalletTask
