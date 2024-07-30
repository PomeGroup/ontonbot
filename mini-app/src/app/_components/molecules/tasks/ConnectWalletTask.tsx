'use client'

import { trpc } from '@/app/_trpc/client'
import useWebApp from '@/hooks/useWebApp'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
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

    const friendlyAddress = useMemo(() => {
        if (userAddress) {
            return Address.parse(userAddress).toString()
        }
    }, [userAddress])

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
        try {
            if (isWalletConnected && tonConnectUI.account?.address) {
                addWalletMutation.mutate({
                    initData: WebApp?.initData,
                    wallet: Address.parse(
                        tonConnectUI.account.address
                    ).toString(),
                })

                return
            }
        } catch {}
    }, [isWalletConnected, tonConnectUI.account?.address])

    const onConnectClick = async () => {
        hapticFeedback?.impactOccurred('medium')

        if (!tonConnectUI.account) {
            await tonConnectUI.openModal()
        }
    }

    const connectedWallet = useMemo(() => {
        return friendlyAddress?.slice(0, 4) + '...' + friendlyAddress?.slice(-4)
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
