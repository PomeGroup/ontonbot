

import Buttons from "@/app/_components/atoms/buttons";
import Images from "@/app/_components/atoms/images";
import Labels from "@/app/_components/atoms/labels";
import EventDates from "@/app/_components/EventDates";
import { Separator } from "@/components/ui/separator";
import { useEventData } from "./eventPageContext";
import { EventTasks } from "./EventTasks";
import { EventActions } from "./EventActions";
import { FormEventHandler, useLayoutEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import MainButton from "../atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";

const EventImage = () => {
  const { eventData } = useEventData();
  return <Images.Event width={300} height={300} url={eventData.data?.image_url!} />;
};

const EventTitle = () => {
  const { eventData } = useEventData();
  return (
    <Labels.CampaignTitle title={eventData.data?.title!} className="my-2" />
  );
};

const EventDescription = () => {
  const { eventData } = useEventData();
  return (
    <Labels.CampaignDescription
      description={eventData.data?.subtitle!}
      className="text-secondary text-gray-400 my-2 "
    />
  );
};

const EventLocation = () => {
  const { location, success } = useEventData();
  return location && !success ? (
    <Labels.LocationPin
      location={location}
      className="text-secondary text-[14px] my-2"
    />
  ) : null;
};

const EventDatesComponent = () => {
  const { startUTC, endUTC } = useEventData();
  return <EventDates startDate={startUTC} endDate={endUTC} />;
};

const EventWebsiteLink = () => {
  const { location, success } = useEventData();
  return location && success ? (
    <Labels.WebsiteLink location={location} />
  ) : null;
};


const EventDescriptionFull = () => {
  const { eventData } = useEventData();
  return (
    <Labels.CampaignDescription description={eventData.data?.description!} />
  );
};

const EventPasswordInput = () => {
  const { initData, eventPasswordField } = useEventData()
  const trpcUtils = trpc.useUtils();
  const formRef = useRef<HTMLFormElement>(null)

  const upsertUserEventFieldMutation =
    trpc.userEventFields.upsertUserEventField.useMutation({
      onError: (error) => {
        toast.error(error.message)
      },
      onSuccess: () => {
        trpcUtils.userEventFields.invalidate();
        trpcUtils.users.getVisitorReward.invalidate({}, { refetchType: "all" });
      },
    });

  const submitPassword: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()

    // Get password field in the form
    const formData = new FormData(e.currentTarget);
    const password = formData.get('event_password') as string;

    if (initData && eventPasswordField && eventPasswordField.event_id) {
      if (password) {
        upsertUserEventFieldMutation.mutate({
          init_data: initData,
          field_id: eventPasswordField.id,
          event_id: eventPasswordField.event_id,
          data: password
        })
      } else {
        toast.error('Enter the event password')
      }
    }
  }
  return (
    <form className="mt-2 space-y-1" ref={formRef} onSubmit={submitPassword}>
      <Input
        placeholder="Event password"
        name='event_password'
        autoFocus type="text"
        className="bg-muted"
        minLength={4} />
      <p className="text-muted-foreground text-xs">
        Enter the Event Password that the organizer shared
        to confirm your participation in the event.
      </p>
      <MainButton
        progress={upsertUserEventFieldMutation.isLoading}
        text="Enter Password" onClick={() => formRef.current?.requestSubmit()}
        disabled={upsertUserEventFieldMutation.isLoading}
      />
    </form>
  )
}

export const EventSections = () => {
  const { eventData, eventHash, userEventPasswordField, isStarted, isNotEnded } = useEventData()
  const { setTheme } = useTheme()
  const { authorized, role, user } = useAuth();

  useLayoutEffect(() => {
    setTheme('light')
  }, [])

  console.log(isStarted && isNotEnded);


  return (
    <div>
      <EventImage />
      {
        authorized &&
        role !== "admin" || user?.user_id !== eventData.data?.owner &&
        !userEventPasswordField?.completed && isStarted && isNotEnded &&
        <EventPasswordInput />
      }
      <EventTitle />
      <EventDescription />
      <Separator className="bg-gray-700 my-2" />
      <EventLocation />
      <EventDatesComponent />
      <Separator className="bg-gray-700 my-2" />
      <EventWebsiteLink />
      <EventActions eventHash={eventHash} />
      <Separator className="bg-gray-700 my-2" />
      <EventDescriptionFull />
      <Separator className="bg-gray-700 my-2" />
      <EventTasks eventHash={eventHash} />
      {/* <ManageEventButton /> */}
      <Buttons.Support />
    </div>
  )
}
