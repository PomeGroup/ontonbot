import Buttons from "@/app/_components/atoms/buttons";
import Images from "@/app/_components/atoms/images";
import Labels from "@/app/_components/atoms/labels";
import EventDates from "@/app/_components/EventDates";
import { useEventData } from "./eventPageContext";
import { EventActions } from "./EventActions";
import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";
import ShareEventButton from "../ShareEventButton";
import { EventPasswordInput } from "./EventPasswordInput";
import EventKeyValue from "../organisms/events/EventKewValue";
import { ClaimRewardButton } from "./ClaimRewardButton";
import { ManageEventButton } from "./ManageEventButton";
import { useUserStore } from "@/context/store/user.store";
import MainButton from "../atoms/buttons/web-app/MainButton";

const EventImage = () => {
  const { eventData } = useEventData();
  return (
    <Images.Event
      width={300}
      height={300}
      url={eventData.data?.image_url!}
    />
  );
};

const EventTitle = () => {
  const { eventData } = useEventData();
  return <Labels.CampaignTitle title={eventData.data?.title!} />;
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
    />
  ) : null;
};

const EventWebsiteLink = () => {
  const { location, isLocationUrl } = useEventData();

  return location && isLocationUrl ? (
    <EventKeyValue
      variant={"link"}
      label={"Event Link"}
      value={location}
    />
  ) : null;
};

const EventDatesComponent = () => {
  const { startUTC, endUTC } = useEventData();
  return (
    <EventDates
      startDate={startUTC}
      endDate={endUTC}
    />
  );
};

const EventDescription = () => {
  const { eventData } = useEventData();
  return (
    <Labels.CampaignDescription description={eventData.data?.description!} />
  );
};

const EventHead = () => {
  const { eventHash } = useEventData();

  return (
    <div className="flex items-start justify-between">
      <div>
        <EventTitle />
        <EventSubtitle />
      </div>
      <ShareEventButton event_uuid={eventHash} />
    </div>
  );
};

const EventAttributes = () => {
  return (
    <div className="space-y-2">
      <EventLocation />
      <EventWebsiteLink />
      <EventDatesComponent />
    </div>
  );
};

export const EventSections = () => {
  const { eventData, userEventPasswordField, isStarted, isNotEnded, initData } =
    useEventData();
  const { setTheme } = useTheme();
  const { user } = useUserStore();

  const isAdminOrOrganizer =
    user?.role === "admin" || user?.user_id === eventData.data?.owner;
  const isEventActive = isStarted && isNotEnded;

  useLayoutEffect(() => {
    setTheme("light");
    return () => setTheme("dark");
  }, [setTheme]);

  return (
    <div className="space-y-2">
      <EventImage />
      {!isAdminOrOrganizer &&
        isEventActive &&
        isStarted &&
        isNotEnded &&
        !userEventPasswordField?.completed && <EventPasswordInput />}
      <EventHead />
      <EventAttributes />
      <EventActions />
      <EventDescription />
      {!isAdminOrOrganizer &&
        user?.wallet_address &&
        userEventPasswordField?.completed && (
          <ClaimRewardButton
            initData={initData}
            eventId={eventData.data?.event_uuid as string}
            isWalletConnected={Boolean(user.wallet_address)}
          />
        )}
      {!isAdminOrOrganizer && !isStarted && isNotEnded && (
        <MainButton
          text="Event Not Started Yet"
          disabled
          color="secondary"
        />
      )}
      {!isAdminOrOrganizer && !isNotEnded && (
        <MainButton
          text="Event Has Ended"
          disabled
          color="secondary"
        />
      )}
      {isAdminOrOrganizer && <ManageEventButton />}
      <Buttons.Support />
    </div>
  );
};
