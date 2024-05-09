'use client'

import { FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    CreateEventData,
    FieldElement,
    TRequiredEventFields,
    RequiredEventFieldsSchema,
    ZodErrors,
} from '@/types'
import { trpc } from '../_trpc/client'
import { useRouter } from 'next/navigation'
import { GithubIcon, Trash, TwitterIcon } from 'lucide-react'
import useWebApp from '@/hooks/useWebApp'
import Buttons from './atoms/buttons'
import Popovers from './molecules/popovers'
import Labels from './atoms/labels'
import Fields from './organisms/fields'

const CreateEventFields: FC<{
    event?: CreateEventData
    event_uuid: string
}> = ({ event, event_uuid }) => {
    const WebApp = useWebApp()
    const userId = WebApp?.initDataUnsafe.user?.id
    const router = useRouter()
    const addEventMutation = trpc.events.addEvent.useMutation()
    const updateEventMutation = trpc.events.updateEvent.useMutation()
    const deleteEventMutation = trpc.events.deleteEvent.useMutation()

    const [requredEventErrors, setRequiredEventErrors] = useState<ZodErrors>({})

    const [requiredEventFields, setRequiredEventFields] =
        useState<TRequiredEventFields>(
            (event || { secret_phrase: '', type: 0 }) as TRequiredEventFields
        )
    const [fields, setFields] = useState<FieldElement[]>(
        event?.dynamic_fields || []
    )

    const handleSubmit = async (): Promise<void> => {
        const parseResult =
            RequiredEventFieldsSchema.safeParse(requiredEventFields)

        let zodErrors = {}
        if (!parseResult.success) {
            parseResult.error.issues.forEach((issue) => {
                zodErrors = { ...zodErrors, [issue.path[0]]: issue.message }
            })

            setRequiredEventErrors(zodErrors)
            return
        }

        // @ts-ignore
        if (event?.event_uuid) {
            // @ts-ignore
            await updateEventMutation.mutateAsync({
                // @ts-ignore
                eventData: {
                    // @ts-ignore
                    event_uuid: event.event_uuid,
                    ...requiredEventFields,
                    start_date: requiredEventFields.start_date!,
                    end_date: requiredEventFields.end_date || null,
                    dynamic_fields: fields,
                },
                initData: WebApp?.initData,
            })
            router.push(`/events`)
        } else {
            await addEventMutation.mutateAsync({
                eventData:
                {
                    owner: userId || 0,
                    ...requiredEventFields,
                    start_date: requiredEventFields.start_date!,
                    end_date: requiredEventFields.end_date || null,
                    dynamic_fields: fields,
                },
                initData: WebApp?.initData,
            })
            router.push(`/events/${event_uuid}`)
        }
    }

    const handleDelete = async (): Promise<void> => {
        WebApp?.showConfirm('Are you sure you want to delete this event?\nThis action cannot be undone.', async (confirmed: boolean) => {

            if (confirmed === false) {
                return
            }
            await deleteEventMutation.mutateAsync(
                {
                    event_uuid,
                    initData: WebApp?.initData,
                }
            )
            router.push('/events')
        })
    }

    const addGitHubField = () => {
        const newField = {
            type: 'input',
            title: 'GitHub Username',
            description: 'Please enter your GitHub username',
            placeholder: 'GitHub username',
            emoji: '🐙',
        };
        setFields((prevFields) => [...prevFields, newField]);
    };

    const addTwitterField = () => {
        const newField = {
            type: 'input',
            title: 'Twitter Handle',
            description: 'Please enter your Twitter handle',
            placeholder: '@example',
            emoji: '🐦',
        };
        setFields((prevFields) => [...prevFields, newField]);
    };

    return (
        <>
            <Fields.Required
                formData={requiredEventFields}
                setFormData={setRequiredEventFields}
                zodErrors={requredEventErrors}
            />
            <Labels.CampaignTitle className="text-lg" title={'Event Fields'} />
            <Fields.Dynamic fields={fields} setFields={setFields} />

            <div className="flex gap-2">
                <Popovers.AddInputField setFields={setFields} />
                <Popovers.AddButtonField setFields={setFields} />
            </div>

            <div className="flex gap-2 mt-2">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={addTwitterField}
                >
                    <TwitterIcon />
                </Button>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={addGitHubField}
                >
                    <GithubIcon />
                </Button>
            </div>

            <Buttons.WebAppMain text="Save" onClick={handleSubmit} />

            <div className="flex w-full mt-2">
                <Button
                    className="flex-1 flex flex-row items-center justify-center"
                    variant="destructive"
                    onClick={handleDelete}
                    type="submit"
                >
                    <Trash className="mr-2" size={20} />
                    Delete Event
                </Button>
            </div>

            <Buttons.WebAppBack whereTo={'/events'} />
        </>
    )
}

export default CreateEventFields
