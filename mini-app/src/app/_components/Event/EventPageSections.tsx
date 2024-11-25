import React from "react";
import Buttons from "@/app/_components/atoms/buttons";
import Images from "@/app/_components/atoms/images";
import Labels from "@/app/_components/atoms/labels";
import EventDates from "@/app/_components/EventDates";
import { useEventData } from "./eventPageContext";
import { EventActions } from "./EventActions";
import ShareEventButton from "../ShareEventButton";
import { EventPasswordInput } from "./EventPasswordInput";
import EventKeyValue from "../organisms/events/EventKewValue";
import { ClaimRewardButton } from "./ClaimRewardButton";
import { ManageEventButton } from "./ManageEventButton";
import { useUserStore } from "@/context/store/user.store";
import MainButton from "../atoms/buttons/web-app/MainButton";
import UserRegisterForm from "./UserRegisterForm";
import DataStatus from "../molecules/alerts/DataStatus";

// Base components with memoization where beneficial
const EventImage = React.memo(() => {
  const { eventData } = useEventData();
  return (
    <Images.Event
      width={300}
      height={300}
      url={eventData.data?.image_url ?? ""}
    />
  );
});

EventImage.displayName = "EventImage";

const EventTitle = React.memo(() => {
  const { eventData } = useEventData();
  return <Labels.CampaignTitle title={eventData.data?.title ?? ""} />;
});

EventTitle.displayName = "EventTitle";

const EventSubtitle = React.memo(() => {
  const { eventData } = useEventData();
  return (
    <Labels.CampaignDescription
      description={eventData.data?.subtitle ?? ""}
      className="text-gray-600 text-xs"
    />
  );
});
EventSubtitle.displayName = "EventSubtitle";

const EventLocation = React.memo(() => {
  const { location, isLocationUrl } = useEventData();
  if (!location || isLocationUrl) return null;

  return (
    <EventKeyValue
      label="Location"
      value={location}
      className="text-cn-primary text-[14px]"
    />
  );
});
EventLocation.displayName = "EventLocation";

const EventWebsiteLink = React.memo(() => {
  const { location, isLocationUrl } = useEventData();
  if (!location || !isLocationUrl) return null;

  return (
    <EventKeyValue
      variant="link"
      label="Event Link"
      value={location}
    />
  );
});
EventWebsiteLink.displayName = "EventWebsiteLink";

const EventDatesComponent = React.memo(() => {
  const { startUTC, endUTC } = useEventData();
  return (
    <EventDates
      startDate={startUTC}
      endDate={endUTC}
    />
  );
});

EventDatesComponent.displayName = "EventDatesComponent";

const EventDescription = React.memo(() => {
  const { eventData } = useEventData();
  return <Labels.CampaignDescription description={eventData.data?.description ?? ""} />;
});

EventDescription.displayName = "EventDescription";

const EventHead = React.memo(() => {
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
});
EventHead.displayName = "EventHead";

const EventAttributes = React.memo(() => {
  return (
    <div className="space-y-2">
      <EventLocation />
      <EventWebsiteLink />
      <EventDatesComponent />
    </div>
  );
});
EventAttributes.displayName = "EventAttributes";

// Status component to handle different event states
const EventRegistrationStatus = ({
  registrantStatus,
  capacityFilled,
  hasWaitingList,
}: {
  registrantStatus: "" | "approved" | "rejected" | "pending";
  capacityFilled: boolean;
  hasWaitingList: boolean;
}) => {
  const statusConfigs = {
    "": () => <UserRegisterForm />,
    pending: () => (
      <DataStatus
        status="pending"
        title="Request Pending"
        description="Your request to join this event is pending to be approved."
      />
    ),
    approved: () => (
      <DataStatus
        status="approved"
        title="Request Approved"
        description="Your request to join this event has been approved"
      />
    ),
    rejected: () => (
      <DataStatus
        status="rejected"
        title="Request Rejected"
        description="Your request to join this event has been rejected."
      />
    ),
  };

  if (capacityFilled && !hasWaitingList) {
    return (
      <>
        <DataStatus
          status="rejected"
          title="Capacity Filled"
          description="Event capacity is filled and no longer accepts registrations."
        />
        <MainButton
          text="Event Capacity Filled"
          disabled
          color="secondary"
        />
      </>
    );
  }

  return statusConfigs[registrantStatus]?.() ?? null;
};

// Main component
export const EventSections = () => {
  const { eventData, userEventPasswordField, isStarted, isNotEnded, initData } = useEventData();
  const { user } = useUserStore();

  const isAdminOrOrganizer = user?.role === "admin" || user?.user_id === eventData.data?.owner;
  const showPasswordInput =
    !isAdminOrOrganizer &&
    (eventData.data?.registrant_status === "approved" || !eventData.data?.has_registration) &&
    !userEventPasswordField?.completed;

  return (
    <div className="space-y-2">
      <EventImage />

      {showPasswordInput && <EventPasswordInput />}

      <EventHead />
      <EventAttributes />
      <EventActions />
      <EventDescription />

      {!isAdminOrOrganizer && eventData.data?.has_registration
        ? eventData.data?.registrant_status === "approved"
        : true &&
          user?.wallet_address &&
          userEventPasswordField?.completed && (
            <ClaimRewardButton
              initData={initData}
              eventId={eventData.data?.event_uuid ?? ""}
              isWalletConnected={Boolean(user.wallet_address)}
            />
          )}

      {!isAdminOrOrganizer && eventData.data?.has_registration && (
        <EventRegistrationStatus
          registrantStatus={eventData.data?.registrant_status ?? ""}
          capacityFilled={Boolean(eventData.data?.capacity_filled)}
          hasWaitingList={Boolean(eventData.data?.has_waiting_list)}
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
