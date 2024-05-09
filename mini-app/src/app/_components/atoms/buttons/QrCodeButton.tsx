'use client'

import { trpc } from '@/app/_trpc/client'
import { Button } from '@/components/ui/button'
import useWebApp from '@/hooks/useWebApp'
import React, { useEffect, useRef, useState } from 'react'

const QrCodeButton = ({ url, hub }: { url: string; hub?: string }) => {
    const [initData, setInitData] = useState<string>('')

    const WebApp = useWebApp()
    const requestSendQRcodeMutation = trpc.events.requestSendQRcode.useMutation()

    useEffect(() => {
        setInitData(WebApp?.initData || '')
    }, [WebApp, WebApp?.initData])

    return (
        <Button
            className="w-full"
            variant={'outline'}
            disabled={!initData}
            onClick={async () => {
                WebApp?.HapticFeedback.impactOccurred("medium")
                requestSendQRcodeMutation.mutate({
                    url,
                    hub,
                    initData,
                })
                WebApp?.close()
            }}
        >
            Get Link and QR
        </Button>
    )
}

export default QrCodeButton
