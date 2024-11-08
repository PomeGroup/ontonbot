

import Buttons from "@/app/_components/atoms/buttons";
import Images from "@/app/_components/atoms/images";
import Labels from "@/app/_components/atoms/labels";
import EventDates from "@/app/_components/EventDates";
import { Separator } from "@/components/ui/separator";
import { useEventData } from "./eventPageContext";
import { EventTasks } from "./EventTasks";
import { ManageEventButton } from "./ManageEventButton";
import { EventActions } from "./EventActions";
import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";

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

export const EventSections = () => {
  const { eventHash } = useEventData()

  const { setTheme } = useTheme()

  useLayoutEffect(() => {
    setTheme('light')
  }, [])

  return <div className="p-2">
    <EventImage />
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
    <ManageEventButton />
    <Buttons.Support />
  </div>
}
