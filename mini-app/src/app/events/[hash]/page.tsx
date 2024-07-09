import AddVisitorWrapper from '@/app/_components/AddVisitorWrapper'
import Buttons from '@/app/_components/atoms/buttons'
import Images from '@/app/_components/atoms/images'
import Labels from '@/app/_components/atoms/labels'
import { ClaimRewardButton } from '@/app/_components/ClaimRewardButton'
import EventNotStarted from '@/app/_components/EventNotStarted'
import Tasks from '@/app/_components/molecules/tasks'
import AllTasks from '@/app/_components/Tasks'
import { serverClient } from '@/app/_trpc/serverClient'
import { type Metadata } from 'next/types'
import zod from 'zod'

type Props = { params: { hash: string } }

export async function generateMetadata(
    { params }: Props,
): Promise<Metadata> {
    const eventData = await serverClient.events.getEvent(params.hash)

    if (eventData === null) {
        return {
            title: "Onton - Not Found",
        }
    }

    return {
        title: eventData.title,
        description: eventData.description,
        openGraph: {
            images: [eventData.image_url as string],
            siteName: "Onton"
        },
    }
}


async function EventPage({ params }: Props) {
    if (params.hash?.length !== 36) {
        return (
            <div>
                Incorrect event link. Startapp param should be 36 characters
                long
            </div>
        )
    }

    const eventData = await serverClient.events.getEvent(params.hash)

    if (eventData === null) {
        return <div>Something went wrong...</div>
    }

    const startUTC = Number(eventData.start_date) * 1000
    const endUTC = Number(eventData.end_date) * 1000

    const currentTime = Date.now()
    const isNotEnded = currentTime < endUTC
    const isStarted = currentTime > startUTC
    const location = eventData.location
    const urlSchema = zod.string().url()
    const { success } = urlSchema.safeParse(location)

    return (
        <AddVisitorWrapper hash={params.hash}>
            <Images.Event url={eventData.image_url!} />
            <Labels.CampaignTitle title={eventData.title!} className="mt-6" />
            <Labels.CampaignDescription
                description={eventData.subtitle!}
                className="text-secondary text-[14px] mb-2"
            />
            {
                location ?
                    success ?
                        <Labels.WebsiteLink location={location}>
                        </Labels.WebsiteLink> :
                        <Labels.CampaignDescription
                            description={location}
                            className="text-secondary text-[14px] mb-2"
                        />
                    : null
            }
            <Labels.CampaignDescription description={eventData.description!} />
            {isStarted && isNotEnded ? (
                <>
                    <Tasks.Wallet />
                    <AllTasks
                        tasks={eventData.dynamic_fields}
                        eventHash={params.hash}
                    />
                </>
            ) : // if it was not ended than it means the event is not started yet
                isNotEnded ? (
                    <EventNotStarted
                        title="Event is not started yet"
                        end_date={endUTC}
                        start_date={startUTC}
                    />
                ) : (
                    <EventNotStarted
                        title="Event is ended already"
                        end_date={endUTC}
                        start_date={startUTC}
                    />
                )}

            {
                eventData.event_uuid &&
                <ClaimRewardButton eventId={eventData.event_uuid} />
            }
            <Buttons.Support />
        </AddVisitorWrapper>
    )

    // return (<div>HELLOW</div>)
}

export default EventPage

export const dynamic = 'force-dynamic'
