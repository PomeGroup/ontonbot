'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
    useTonAddress,
    useTonConnectUI,
    useTonWallet,
} from '@tonconnect/ui-react'
import useWebApp from '@/hooks/useWebApp'
import { trpc } from '@/app/_trpc/client'
import Tasks from '.'
import { useCompleteStore } from '@/zustand/store'

const ConnectWalletTask = () => {
    const WebApp = useWebApp()
    const wallet = useTonWallet()
    const friendlyAddress = useTonAddress()
    const [tonConnectUI] = useTonConnectUI()
    const addWalletMutation = trpc.users.addWallet.useMutation()
    const userAddress = trpc.users.getWallet.useQuery(
        {
            initData: WebApp?.initData,
        }
    ).data


    const [isWalletConnected, setIsWalletConnected] = useState<boolean | undefined>(undefined)

    useEffect(() => {
        setIsWalletConnected(wallet !== null || (userAddress !== '' && userAddress !== null && userAddress !== undefined))
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
        WebApp?.HapticFeedback.impactOccurred('medium')

        if (tonConnectUI.account) {
            WebApp?.showConfirm(
                "Do you want to change your current wallet?\nPlease confirm to proceed or cancel to keep your existing wallet.",
                (confirmed: boolean) => {
                    if (!confirmed) {
                        WebApp?.HapticFeedback.notificationOccurred('error')
                        return
                    }


                    WebApp?.HapticFeedback.notificationOccurred('success')
                    tonConnectUI.disconnect()
                    tonConnectUI.openModal()
                }
            )
            return
        }
        await tonConnectUI.openModal()
    }

    return (

        <>
            <Tasks.Generic
                title="Connect TON Wallet"
                description="Register at event and receive an SBT"
                completed={isWalletConnected}
                defaultEmoji="👛"
                onClick={onConnectClick}
            />
        </>
    )
}

export default ConnectWalletTask
