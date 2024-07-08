'use client'

import { Button } from '@/components/ui/button'
import useAuth from '@/hooks/useAuth'
import useWebApp from '@/hooks/useWebApp'
import { getDateFromUnix, getTimeFromUnix } from '@/utils'
import { BadgePlus } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import QrCodeButton from '../_components/atoms/buttons/QrCodeButton'
import Card from '../_components/atoms/cards'
import Labels from '../_components/atoms/labels'
import Skeletons from '../_components/molecules/skeletons'
import { trpc } from '../_trpc/client'
import { CommingSoon } from '../_components/CommingSoon'

const EventsAdminPage = () => {
    noStore()

    const WebApp = useWebApp()
    const { authorized, isLoading } = useAuth()
    const initData = WebApp?.initData
    const validatedData = trpc.users.validateUserInitData.useQuery(
        initData || ''
    )
    const eventsData = trpc.events.getEvents.useQuery({ initData })

    if (
        eventsData.isLoading ||
        isLoading ||
        validatedData.isLoading ||
        !initData
    ) {
        return <Skeletons.Events />
    }

    if (!authorized || eventsData.isError) {
        return <CommingSoon />
    }


    return (
        <div>
            <Link
                href={`/events/create`}
                className="w-full"
                onClick={() => WebApp?.HapticFeedback.impactOccurred('medium')}
            >
                <Button className="w-full" variant="outline" type="submit">
                    <BadgePlus className="mr-1" width={15} />
                    Create New Event
                </Button>
            </Link>

            {eventsData?.data?.map((event: any) => (
                <div key={`event-${event.event_id}-link`} className="my-4">
                    <Card className="flex flex-col w-full p-0 my-0">
                        <div className="relative h-[200px] w-full overflow-hidden">
                            <Image
                                className="rounded-t-xl w-full h-full object-contain"
                                src={event.image_url!}
                                alt="event image"
                                layout="fill"
                                objectFit="cover"
                            />
                        </div>

                        <div className="w-full flex flex-col gap-2">
                            <div className="text-primary p-4 pb-1">
                                <Labels.CampaignTitle title={event.title!} />
                                <Labels.CampaignDescription
                                    className="text-secondary"
                                    description={event.subtitle!}
                                />
                            </div>
                            <div className="h-[1px] w-full bg-separator" />
                            <div className="flex flex-col gap-1 p-4 pt-1">
                                <div className="text-secondary text-sm">
                                    {event.location}
                                </div>
                                <div className="flex flex-row whitespace-nowrap gap-3 text-primary text-sm items-center">
                                    <TimeRow
                                        start_date={event.start_date!}
                                        end_date={event.end_date}
                                        timeZone={event.timezone!}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex gap-2 mt-2">
                        <Link
                            className="flex-1"
                            href={`events/${event.event_uuid}/edit`}
                            onClick={() =>
                                WebApp?.HapticFeedback.impactOccurred('medium')
                            }
                        >
                            <Button className="w-full" variant={'outline'}>
                                Manage
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <QrCodeButton
                                url={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${event.event_uuid}`}
                                hub={event.society_hub!}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

const TimeRow = ({
    start_date,
    end_date,
    timeZone,
}: {
    start_date: number
    end_date: number | null
    timeZone: string
}) => {
    const startDate = getDateFromUnix(start_date)
    const startTime = getTimeFromUnix(start_date)

    const endTime = end_date ? getTimeFromUnix(end_date) : null
    const endDate = end_date ? getDateFromUnix(end_date) : null

    // Helper to format time
    const formatTime = (time: { hours: string; minutes: string }) =>
        `${time.hours}:${time.minutes}`

    // Helper to format date
    const formatDate = (date: { day: string; month: string }) =>
        `${date?.day}/${date?.month}`

    // Constructing the display string based on the conditions
    let displayString = `${formatTime(startTime)} `

    if (end_date) {
        // If there's an end date, but it's the same as the start date (only times differ)
        if (
            endDate &&
            startDate &&
            formatDate(endDate) === formatDate(startDate)
        ) {
            displayString += `- ${formatTime(endTime!)} ${formatDate(
                startDate
            )} ${timeZone}`
        }
        // If there's an end date and it differs from the start date
        else if (endDate && startDate) {
            displayString += `${formatDate(startDate)} - ${formatTime(
                endTime!
            )} ${formatDate(endDate)} ${timeZone}`
        }
    } else {
        displayString += `${formatDate(startDate!)} ${timeZone}`
    }

    return <div>{displayString}</div>
}

export default EventsAdminPage

export const dynamic = 'force-dynamic'
