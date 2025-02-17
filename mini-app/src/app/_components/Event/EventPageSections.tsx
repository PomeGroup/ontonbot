import React, { useMemo } from "react";
import Images from "@/app/_components/atoms/images";
import EventDates from "@/app/_components/EventDates";
import { useEventData } from "./eventPageContext";
import { EventActions } from "./EventActions";
import ShareEventButton from "../ShareEventButton";
import { EventPasswordAndWalletInput } from "./EventPasswordInput";
import EventKeyValue from "../organisms/events/EventKewValue";
import { ClaimRewardButton } from "./ClaimRewardButton";
import { ManageEventButton } from "./ManageEventButton";
import { useUserStore } from "@/context/store/user.store";
import MainButton from "../atoms/buttons/web-app/MainButton";
import UserRegisterForm from "./UserRegisterForm";
import DataStatus from "../molecules/alerts/DataStatus";
import { useRouter } from "next/navigation";
import SupportButtons from "../atoms/buttons/SupportButton";
import { Card, ListItem, List, Block } from "konsta/react";
import Typography from "@/components/Typography";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import LoadableImage from "@/components/LoadableImage";
import { canUserManageEvent } from "@/lib/userRolesUtils";
import UserCustomRegisterForm from "@/app/_components/Event/UserCustomRegisterForm";
import { Address } from "@ton/core";
import { FaAngleRight } from "react-icons/fa6";
import { TonConnectButton } from "@tonconnect/ui-react";
import Divider from "@/components/Divider";

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

const EventSubtitle = React.memo(() => {
  const { eventData } = useEventData();
  return (
    <Typography
      variant="body"
      weight="medium"
    >
      {eventData.data?.subtitle}
    </Typography>
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

const EventLink = React.memo(() => {
  const { location, isLocationUrl, eventData } = useEventData();
  if (!location || !isLocationUrl) return null;

  return (
    <EventKeyValue
      variant="link"
      label="Event Link"
      value={
        eventData.data?.has_registration && !["approved", "checkedin"].includes(eventData.data.registrant_status)
          ? "Visible after registration"
          : location
      }
    />
  );
});
EventLink.displayName = "EventLink";

const EventWebsiteLink = React.memo(() => {
  const { eventData } = useEventData();
  if (!eventData.data?.website) return null;

  return (
    <EventKeyValue
      variant="link"
      label="website"
      value={eventData.data.website.link}
    />
  );
});
EventWebsiteLink.displayName = "EventWebsiteLink";

const EventTicketPrice = React.memo(() => {
  return (
    <EventKeyValue
      label="Ticket Price"
      value={"Free"}
    />
  );
});
EventTicketPrice.displayName = "EventTicketPrice";

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
  return (
    <Card
      header={
        <Typography
          weight="bold"
          variant="title3"
        >
          About
        </Typography>
      }
      contentWrap={false}
    >
      <Typography
        weight="normal"
        variant={"body"}
        className="p-4 pt-0 whitespace-pre-line"
      >
        {eventData.data?.description ?? ""}
      </Typography>
    </Card>
  );
});

EventDescription.displayName = "EventDescription";

const UserWallet = () => {
  return (
    <Card
      header={
        <Typography
          weight="bold"
          variant="title3"
        >
          Your Wallet
        </Typography>
      }
      contentWrap={false}
    >
      <div className="p-4 pt-0 flex items-center justify-center">
        <TonConnectButton />
      </div>
    </Card>
  );
};

const EventTitle = React.memo(() => {
  const { eventHash, eventData } = useEventData();

  const isNotPublished = !eventData.data?.activity_id || !!eventData.data?.hidden;

  return (
    <div className="mt-4 space-y-4">
      {isNotPublished && (
        <div className="text-sky-500 text-lg font-semibold">Event is not published and pending moderation!</div>
      )}
      <div className="grid grid-cols-12 items-start">
        <Typography
          variant="title2"
          weight="bold"
          className="self-center col-span-10"
        >
          {eventData.data?.title ?? ""}
        </Typography>
        <div className="col-span-2">
          <ShareEventButton
            event_uuid={eventHash}
            activity_id={eventData.data?.activity_id}
            hidden={eventData.data?.hidden}
          />
        </div>
      </div>
      <EventSubtitle />
    </div>
  );
});
EventTitle.displayName = "EventHead";

const EventAttributes = React.memo(() => {
  return (
    <div className="space-y-4">
      <EventLocation />
      <EventLink />
      <EventTicketPrice />
      <EventDatesComponent />
      <EventWebsiteLink />
    </div>
  );
});
EventAttributes.displayName = "EventAttributes";

// Status component to handle different event states
const EventRegistrationStatus = () => {
  const { eventData, isNotEnded } = useEventData();
  const registrantStatus = eventData.data?.registrant_status ?? "";
  const capacityFilled = Boolean(eventData.data?.capacity_filled);
  const hasWaitingList = Boolean(eventData.data?.has_waiting_list);

  if (!isNotEnded || !eventData.data?.has_registration) {
    return null;
  }

  const isCustom = Boolean(eventData.data?.registrationFromSchema?.isCustom);
  if ((hasWaitingList || !capacityFilled) && registrantStatus === "") {
    return isCustom ? <UserCustomRegisterForm /> : <UserRegisterForm />;
  }

  return (
    <Card>
      {capacityFilled && !hasWaitingList && (
        <>
          <DataStatus
            status="rejected"
            title="Capacity Filled"
            description="Event capacity is filled and no longer accepts registrations."
            size="md"
          />
          <MainButton
            text="Event Capacity Filled"
            disabled
            color="secondary"
          />
        </>
      )}

      {!capacityFilled && (
        <>
          {registrantStatus === "pending" && (
            <DataStatus
              status="sent"
              title="Request Pending"
              description="Your request to join this event is pending to be approved."
              size="md"
            />
          )}
          {registrantStatus === "approved" && (
            <DataStatus
              status="approved"
              title="Request Approved"
              description="Your request to join this event has been approved."
              size="md"
            />
          )}
          {registrantStatus === "rejected" && (
            <DataStatus
              status="rejected"
              title="Request Rejected"
              description="Your request to join this event has been rejected."
              size="md"
            />
          )}
          {registrantStatus === "checkedin" && <div></div>}
        </>
      )}
    </Card>
  );
};

const OrganizerCard = React.memo(() => {
  const { eventData } = useEventData();
  const router = useRouter();

  const organizer = eventData?.data?.organizer;

  if (!organizer) return null;

  return (
    <Card
      header={
        <Typography
          weight={"bold"}
          variant="title3"
        >
          Organizer
        </Typography>
      }
      contentWrap={false}
    >
      <List className="!mb-0 !-mt-2">
        <ListItem
          className="cursor-pointer"
          onClick={() => router.push(`/channels/${eventData.data?.owner}/`)}
          title={
            <Typography
              variant="headline"
              weight="medium"
              className="text-primary w-52"
              truncate
            >
              {organizer.org_channel_name || "Untitled organizer"}
            </Typography>
          }
          subtitle={
            <Typography
              weight={"medium"}
              variant="subheadline1"
              className="text-brand-muted"
            >
              {organizer.hosted_event_count || 0} events
            </Typography>
          }
          media={
            <LoadableImage
              alt={organizer.org_channel_name}
              src={organizer.org_image || channelAvatar.src}
              width={48}
              height={48}
            />
          }
          after={<FaAngleRight className="text-primary" />}
        />
      </List>
    </Card>
  );
});
OrganizerCard.displayName = "OrganizerCard";

const SbtCollectionLink = React.memo(() => {
  const { eventData } = useEventData();

  const collectionAddress = eventData.data?.sbt_collection_address;

  const isValidAddress = useMemo(() => {
    try {
      if (!collectionAddress) return false;
      Address.parse(collectionAddress);
      return true;
    } catch {
      return false;
    }
  }, [collectionAddress]);

  if (!isValidAddress) return null;

  return (
    <Card
      header={
        <>
          <Typography
            weight={"bold"}
            variant="title3"
          >
            SBT Reward Badge
          </Typography>
          <Typography
            variant="body"
            weight="normal"
            className="mt-4"
          >
            Reward you receive by attending the event and submitting proof of attendance.
          </Typography>
        </>
      }
      contentWrap={false}
    >
      <Block
        className="!mt-0 mb-4 cursor-pointer"
        onClick={() => window.open(`https://getgems.io/collection/${collectionAddress}`, "_blank")}
      >
        <div className="w-full flex gap-3 items-stretch bg-brand-fill-bg/10 p-2 rounded-lg">
          {eventData.data?.tsRewardImage && (
            <LoadableImage
              alt={eventData.data?.title}
              src={eventData.data?.tsRewardImage}
              width={48}
              height={48}
            />
          )}
          <div className="flex flex-col grow justify-between overflow-hidden">
            <Typography
              variant="headline"
              truncate
              weight="normal"
              className="line-clamp-2"
            >
              {eventData.data?.title}
            </Typography>
            <Typography
              variant="subheadline1"
              className="text-brand-muted"
              truncate
              weight={"medium"}
            >
              {collectionAddress}
            </Typography>
          </div>
        </div>
      </Block>
    </Card>
  );
});
SbtCollectionLink.displayName = "SbtCollectionLink";

const MainButtonHandler = React.memo(() => {
  const { eventData, hasEnteredPassword, isStarted, isNotEnded, initData } = useEventData();
  const { user } = useUserStore();
  const router = useRouter();

  const canManageEvent = canUserManageEvent(user, {
    data: {
      owner: eventData?.data?.owner,
      accessRoles: eventData?.data?.accessRoles,
    },
  });

  const userCompletedTasks =
    (["approved", "checkedin"].includes(eventData.data?.registrant_status!) || !eventData.data?.has_registration) &&
    user?.wallet_address;

  const isOnlineEvent = eventData.data?.participationType === "online";
  const isCheckedIn = eventData.data?.registrant_status === "checkedin" || isOnlineEvent;
  const isEventActive = isStarted && isNotEnded;

  return (
    <>
      {userCompletedTasks && hasEnteredPassword && isCheckedIn && (
        <ClaimRewardButton
          initData={initData}
          eventId={eventData.data?.event_uuid ?? ""}
        />
      )}
      {userCompletedTasks && hasEnteredPassword && !isCheckedIn && isEventActive && eventData.data?.registrant_uuid && (
        <MainButton
          text="Check In"
          onClick={() =>
            router.push(`/events/${eventData.data?.event_uuid}/registrant/${eventData.data?.registrant_uuid}/qr`)
          }
        />
      )}

      {!canManageEvent && !isStarted && isNotEnded && (
        <MainButton
          text="Event Not Started Yet"
          disabled
          color="secondary"
        />
      )}

      {!canManageEvent && !isNotEnded && (
        <MainButton
          text="Event Has Ended"
          disabled
          color="secondary"
        />
      )}
    </>
  );
});
MainButtonHandler.displayName = "MainButtonHandler";

const EventHeader = React.memo(() => {
  const { eventData, hasEnteredPassword, isStarted, isNotEnded } = useEventData();
  const { user } = useUserStore();

  const userCompletedTasks =
    (["approved", "checkedin"].includes(eventData.data?.registrant_status!) || !eventData.data?.has_registration) &&
    user?.wallet_address;

  const isOnlineEvent = eventData.data?.participationType === "online";
  const isEventActive = isStarted && isNotEnded;

  return (
    <Card>
      <EventImage />

      {((userCompletedTasks && !hasEnteredPassword && isEventActive && isOnlineEvent) || !user?.wallet_address) && (
        <EventPasswordAndWalletInput />
      )}

      <EventTitle />
      <Divider margin="medium" />
      <EventAttributes />
      <EventActions />
    </Card>
  );
});
EventHeader.displayName = "EventHeader";

// Main component
export const EventSections = () => {
  return (
    <>
      <EventHeader />
      <ManageEventButton />
      <OrganizerCard />
      <SbtCollectionLink />
      <UserWallet />
      <EventDescription />
      <EventRegistrationStatus />

      <SupportButtons />

      {/* --------------------------------------- */}
      {/* ---------- MainButtonHandler ---------- */}
      {/* --------------------------------------- */}
      <MainButtonHandler />
    </>
  );
};
