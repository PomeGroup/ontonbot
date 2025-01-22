import React from "react";
import Images from "@/app/_components/atoms/images";
import Labels from "@/app/_components/atoms/labels";
import EventDates from "@/app/_components/EventDates";
import { useEventData } from "./eventPageContext";
import { EventActions } from "./EventActions";
import ShareEventButton from "../ShareEventButton";
import { ArrowRight } from "lucide-react";
import { EventPasswordAndWalletInput } from "./EventPasswordInput";
import EventKeyValue from "../organisms/events/EventKewValue";
import { ClaimRewardButton } from "./ClaimRewardButton";
import { ManageEventButton } from "./ManageEventButton";
import { useUserStore } from "@/context/store/user.store";
import MainButton from "../atoms/buttons/web-app/MainButton";
import UserRegisterForm from "./UserRegisterForm";
import DataStatus from "../molecules/alerts/DataStatus";
import { useRouter } from "next/navigation";
import SupportButton from "../atoms/buttons/SupportButton";
import { Card } from "konsta/react";
import Typography from "@/components/Typography";
import Image from "next/image";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import LoadableImage from "@/components/LoadableImage";

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
  registrantStatus: "" | "approved" | "rejected" | "pending" | "checkedin";
  capacityFilled: boolean;
  hasWaitingList: boolean;
}) => {
  const statusConfigs = {
    "": () => <UserRegisterForm />,
    pending: () => (
      <DataStatus
        status="sent"
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
    checkedin: () => {
      <div></div>;
    },
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
  const router = useRouter();
  const { eventData, hasEnteredPassword, isStarted, isNotEnded, initData } = useEventData();
  const { user } = useUserStore();

  const isAdminOrOrganizer = user?.role === "admin" || user?.user_id === eventData.data?.owner;
  const userCompletedTasks =
    (["approved", "checkedin"].includes(eventData.data?.registrant_status!) || !eventData.data?.has_registration) &&
    user?.wallet_address;

  const isOnlineEvent = eventData.data?.participationType === "online";
  const isCheckedIn = eventData.data?.registrant_status === "checkedin" || isOnlineEvent;
  const isEventActive = isStarted && isNotEnded;

  const organizer = eventData?.data?.organizer;

  return (
    <div className="space-y-2">
      <EventImage />

      {((userCompletedTasks && !hasEnteredPassword && isEventActive && isOnlineEvent) || !user?.wallet_address) && (
        <EventPasswordAndWalletInput />
      )}

      <EventHead />
      <EventAttributes />
      <EventActions />
      {isAdminOrOrganizer && <ManageEventButton />}
      <EventDescription />

      {userCompletedTasks && hasEnteredPassword && isCheckedIn && (
        <ClaimRewardButton
          initData={initData}
          eventId={eventData.data?.event_uuid ?? ""}
        />
      )}

      {isNotEnded && eventData.data?.has_registration && (
        <EventRegistrationStatus
          registrantStatus={eventData.data?.registrant_status ?? ""}
          capacityFilled={Boolean(eventData.data?.capacity_filled)}
          hasWaitingList={Boolean(eventData.data?.has_waiting_list)}
        />
      )}

      {organizer && (
        <Card className="w-full my-3 -mx-3" onClick={() => router.push(`/channels/${eventData.data?.owner}/`)}>
          <Typography
            variant="title3"
            className="font-bold mb-2"
          >
            Organizer
          </Typography>
          <div className="w-full flex gap-3 items-stretch">
            <LoadableImage
              alt={organizer.org_channel_name}
              src={isValidImageUrl(organizer.org_image) ? organizer.org_image : channelAvatar.src}
              size={48} />
            <div className="flex flex-col grow justify-between">
              <Typography
                variant="headline"
                className="text-[#007AFF] font-normal line-clamp-2"
              >
                {organizer.org_channel_name || "Untitled organizer"}
              </Typography>
              <Typography
                variant="subheadline1"
                className="text-[#8E8E93]"
              >
                <b>{organizer.hosted_event_count || "1"}</b>
                &nbsp; events
              </Typography>
            </div>
            <div className="self-center">
              <ArrowRight className="text-main-button-color" />
            </div>
          </div>
        </Card>
      )}
      <SupportButton />

      {userCompletedTasks && hasEnteredPassword && !isCheckedIn && isEventActive && eventData.data?.registrant_uuid && (
        <MainButton
          text="Check In"
          onClick={() =>
            router.push(`/events/${eventData.data?.event_uuid}/registrant/${eventData.data?.registrant_uuid}/qr`)
          }
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
    </div>
  );
};
