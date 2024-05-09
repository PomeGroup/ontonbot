import { serverClient } from '@/app/_trpc/serverClient'
import AllTasks from '@/app/_components/Tasks'
import useAddVisitor from '@/hooks/useAddVisitor'
import Images from '@/app/_components/atoms/images'
import Labels from '@/app/_components/atoms/labels'
import Tasks from '@/app/_components/molecules/tasks'
import AddVisitorWrapper from '@/app/_components/AddVisitorWrapper'
import Buttons from '@/app/_components/atoms/buttons'


async function EventPage({
    params,
}: {
    params: { hash: string }
}) {
    if (params.hash?.length !== 36) {
        return <div>Incorrect event link. Startapp param should be 36 characters long</div>
    }

    const eventData = await serverClient.events.getEvent(params.hash)

    if (eventData === null) {
        return <div>Something went wrong...</div>
    }

    return (
        <AddVisitorWrapper hash={params.hash} >

            <Images.Event url={eventData.image_url!} />
            <Labels.CampaignTitle title={eventData.title!} className="mt-6" />
            <Labels.CampaignDescription
                description={eventData.subtitle!}
                className="text-secondary text-[14px] mb-2"
            />
            <Labels.CampaignDescription description={eventData.description!} />

            <Tasks.Wallet />
            <AllTasks tasks={eventData.dynamic_fields} eventHash={params.hash} />

            <Buttons.Support />
        </AddVisitorWrapper>
    )

    // return (<div>HELLOW</div>)
}

export default EventPage
