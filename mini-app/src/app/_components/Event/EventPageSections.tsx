

import Buttons from "@/app/_components/atoms/buttons";
import Images from "@/app/_components/atoms/images";
import Labels from "@/app/_components/atoms/labels";
import EventDates from "@/app/_components/EventDates";
import { useEventData } from "./eventPageContext";
import { EventActions } from "./EventActions";
import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";
import useAuth from "@/hooks/useAuth";
import ShareEventButton from "../ShareEventButton";
import { EventPasswordInput } from "./EventPasswordInput";
import EventKeyValue from "../organisms/events/EventKewValue";

const EventImage = () => {
  const { eventData } = useEventData();
  return <Images.Event width={300} height={300} url={eventData.data?.image_url!} />;
};

const EventTitle = () => {
  const { eventData } = useEventData();
  return (
    <Labels.CampaignTitle title={eventData.data?.title!} />
  );
};

const EventSubtitle = () => {
  const { eventData } = useEventData();
  return (
    <Labels.CampaignDescription
      description={eventData.data?.subtitle!}
      className="text-gray-600 text-xs"
    />
  );
};

const EventLocation = () => {
  const { location, isLocationUrl } = useEventData();
  return location && !isLocationUrl ? (
    <EventKeyValue
      label="Location"
      value={location}
      className="text-primary text-[14px]"
    />) : null
};

const EventWebsiteLink = () => {
  const { location, isLocationUrl } = useEventData();

  return location && isLocationUrl ? (
    <EventKeyValue
      variant={'link'}
      label={'Event Link'}
      value={location}
    />
  ) : null;
};

const EventDatesComponent = () => {
  const { startUTC, endUTC } = useEventData();
  return <EventDates startDate={startUTC} endDate={endUTC} />;
};

const EventDescription = () => {
  const { eventData } = useEventData();
  return (
    <Labels.CampaignDescription description={eventData.data?.description!} />
  );
};

const EventHead = () => {
  const { eventHash } = useEventData()

  return (
    <div className="flex items-start justify-between">
      <div>
        <EventTitle />
        <EventSubtitle />
      </div>
      <ShareEventButton event_uuid={eventHash} />
    </div>
  )
}

const EventAttributes = () => {
  return (
    <div className="space-y-2">
      <EventLocation />
      <EventWebsiteLink />
      <EventDatesComponent />
    </div>
  )
}

export const EventSections = () => {
  const { eventData, userEventPasswordField, isStarted, isNotEnded } = useEventData()
  const { setTheme } = useTheme()
  const { authorized, role, user } = useAuth();

  useLayoutEffect(() => {
    setTheme('light')
  }, [])

  return (
    <div className="space-y-2">
      <EventImage />
      {
        authorized &&
        role !== "admin" || user?.user_id !== eventData.data?.owner &&
        !userEventPasswordField?.completed && isStarted && isNotEnded &&
        <EventPasswordInput />
      }
      <EventHead />
      <EventAttributes />
      <EventActions />
      <EventDescription />
      {/* <ManageEventButton /> */}
      <Buttons.Support />
    </div>
  )
}
