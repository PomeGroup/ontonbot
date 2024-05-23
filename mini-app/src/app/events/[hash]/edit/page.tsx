'use client'

import Buttons from '@/app/_components/atoms/buttons'
import CreateEventFields from '@/app/_components/CreateEventFields'
import Alerts from '@/app/_components/molecules/alerts'
import Tables from '@/app/_components/molecules/tables'
import RoomWallet from '@/app/_components/organisms/room-wallet'
import { trpc } from '@/app/_trpc/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useAuth from '@/hooks/useAuth'
import useWebApp from '@/hooks/useWebApp'
import { FC } from 'react'

const CreateEventAdminPage: FC<{ params: { hash: string } }> = ({ params }) => {
    const WebApp = useWebApp()
    const event = trpc.events.getEvent.useQuery(params.hash, {
        cacheTime: 0,
    })

    const postVisitorsMutation =
        trpc.events.postActivityParticipants.useMutation()

    const { authorized, isLoading } = useAuth()

    const requestExportFileMutation =
        trpc.events.requestExportFile.useMutation()

    if (isLoading || event.status === 'loading') {
        return null
    }

    if (authorized === false) {
        return <Alerts.NotAuthorized />
    }

    if (event.error) {
        return <div>{event.error.message}</div>
    }

    const handleVisitorsExport = () => {
        WebApp?.HapticFeedback.impactOccurred('medium')

        requestExportFileMutation.mutate({
            event_uuid: params.hash,
            initData: WebApp?.initData || '',
        })

        WebApp?.close()
    }

    return (
        <div>
            <Tabs defaultValue="manage" className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                        onClick={() =>
                            WebApp?.HapticFeedback.impactOccurred('medium')
                        }
                        value="manage"
                    >
                        Manage
                    </TabsTrigger>
                    <TabsTrigger
                        onClick={() =>
                            WebApp?.HapticFeedback.impactOccurred('medium')
                        }
                        value="edit"
                    >
                        ⚙️ Edit
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="manage">
                    {event.data?.wallet_address && (
                        <RoomWallet
                            hash={params.hash}
                            walletAddress={event.data?.wallet_address}
                        />
                    )}

                    <Button
                        className="w-full mt-2"
                        variant={'outline'}
                        onClick={async () => {
                            const res = postVisitorsMutation.mutate({
                                event_id: event.data!.event_id,
                            })
                        }}
                    >
                        Upload Visitors to society.ton.org
                    </Button>

                    <div className="mt-2">
                        <Button
                            className="w-full relative"
                            variant={'outline'}
                            onClick={handleVisitorsExport}
                        >
                            Export Visitors as CSV to Clipboard
                        </Button>
                    </div>

                    <Tables.Visitors event_uuid={params.hash} />

                    <Buttons.WebAppBack whereTo={'/events'} />
                </TabsContent>

                <TabsContent value="edit">
                    <CreateEventFields
                        /* @ts-ignore  */
                        event={event.data}
                        event_uuid={params.hash}
                    />

                    <Buttons.WebAppBack whereTo={'/events'} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default CreateEventAdminPage

export const dynamic = 'force-dynamic'
