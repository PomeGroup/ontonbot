'use client'

import { trpc } from '@/app/_trpc/client'
import { Button } from '@/components/ui/button'
import useWebApp from '@/hooks/useWebApp'
import { useHapticFeedback, useMiniApp } from '@tma.js/sdk-react'

const QrCodeButton = ({ url, hub }: { url: string; hub?: string }) => {
    const WebApp = useWebApp()
    const miniApp = useMiniApp(true)
    const initData = WebApp?.initData || ''
    const hapticFeedback = useHapticFeedback(true)
    const requestSendQRcodeMutation =
        trpc.events.requestSendQRcode.useMutation()

    return (
        <Button
            className="w-full"
            variant={'outline'}
            disabled={!initData}
            onClick={async () => {
                hapticFeedback?.impactOccurred('medium')
                requestSendQRcodeMutation.mutate({
                    url,
                    hub,
                    initData,
                })
                miniApp?.close()
            }}
        >
            Get Link and QR
        </Button>
    )
}

export default QrCodeButton
