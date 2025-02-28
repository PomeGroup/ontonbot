import { ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { Section } from "@ui/base/section";
import QueryState from "@ui/components/blocks/QueryState";
import SectionCoverImage from "@ui/components/blocks/SectionCoverImage";
import PageTma from "@ui/components/Page";
import SeparatorTma from "@ui/components/Separator";

import EventAttributes from "~/components/event/EventAttributes";
import EventContent from "~/components/event/EventContent";
import EventHeader from "~/components/event/EventHeader";
import EventTmaSettings from "~/components/event/EventTmaSettings";
import GatewayAgenda from "~/components/event/GatewayAgenda";
import ManageEventButton from "~/components/event/ManageEventButton";
import WalletButton from "~/components/event/WalletButton";
import WebsiteLink from "~/components/event/WebsiteLink";
import { getEventDataOnly } from "~/services/event.services.ssr";
import { getUser } from "~/services/user.services";
import { getAuthenticatedUser } from "~/utils/getAuthenticatedUser";
import AddToCalendar from "~/components/event/AddToCalendar";
import OrganizerSection from "./OrganizerSection";
import SBTCollectionSection from "./SbtCollectionSection";

type EventParams = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | undefined };
};

function canUserManageEvent(
  user: { user_id: number; role: string } | null,
  eventData: { data?: { owner?: number | null; accessRoles?: Array<{ user_id: number; role: string }> } }
): boolean {
  console.log("eventData", eventData);
  if (!user || !eventData?.data?.owner || !eventData.data.accessRoles) {
    return false;
  }
  const isAdmin = user.role === "admin";
  const isOwner = user.user_id === eventData?.data?.owner;

  // accessRoles is an array of { user_id: number, role: string }
  const accessRoles = eventData?.data?.accessRoles ?? [];
  const isInAccessRoles = accessRoles.some((ar) => ar.user_id === user.user_id);

  return isAdmin || isOwner || isInAccessRoles;
}

const Event = async ({ params, searchParams }: EventParams) => {
  noStore();
  const [userId, error] = getAuthenticatedUser();

  const page_utm = searchParams.utm_campaign || null;

  if (error) {
    return (
      <QueryState
        isError
        text={`Authentication failed`}
        description={JSON.stringify(await error.json())}
      />
    );
  }

  const user = await getUser(userId);
  if (!user) {
    return (
      <QueryState
        isError
        text={`User #${userId} Not Found`}
      />
    );
  }

  const eventData = await getEventDataOnly(params.id);
  if (!eventData) {
    return (
      <QueryState
        isError
        text={`Event #${params.id} Not Found`}
      />
    );
  }

  if (page_utm) {
    console.log("ptma_event_page_utm", `utm_campaign=${page_utm} , user_id=${userId}`);
  }

  const eventManagerRole = canUserManageEvent(
    {
      role: user.role,
      user_id: user.user_id,
    },
    {
      data: {
        accessRoles: eventData.accessRoles,
        owner: eventData.owner,
      },
    }
  );
  const websiteLink = eventData?.website?.link;
  const websiteLabel = eventData?.website?.label;

  const attributes: [string, ReactNode][] = [];

  attributes.push(["Location", eventData.location]);

  if (eventData.eventTicket) {
    attributes.push(["Ticket Price", `${eventData.eventTicket?.price} ${eventData.eventTicket.payment_type}`]);
  }

  if (eventData?.website && websiteLabel && websiteLink) {
    attributes.push([
      "Website",
      <WebsiteLink
        label={websiteLabel}
        link={websiteLink}
      />,
    ]);
  }

  return (
    <PageTma variant={"withSections"}>
      <Section
        variant={"bottomRounded"}
        className={"pb-2"}
      >
        <SectionCoverImage>
          <Image
            priority
            width={352}
            height={352}
            src={eventData.image_url}
            alt={`event-${params.id}`}
            className="border-wallet-separator-color w-full rounded-lg border-[0.33px] object-contain"
          />
        </SectionCoverImage>
        <EventHeader
          event_uuid={eventData.event_uuid}
          title={eventData.title}
          description={eventData.subtitle}
        />
        <SeparatorTma />
        <EventAttributes
          event={{
            end_date: eventData.end_date,
            start_date: eventData.start_date,
          }}
          data={attributes}
        />
      </Section>
      <Section
        variant={"rounded"}
        className={"py-6 space-y-2"}
      >
        {eventManagerRole && <ManageEventButton />}
        <AddToCalendar
          description={eventData.subtitle}
          title={eventData.title}
          startDate={Number(eventData.start_date) * 1000}
          endDate={Number(eventData.end_date) * 1000}
        />
      </Section>
      <Section
        variant={"rounded"}
        className={"py-6"}
      >
        <WalletButton />
      </Section>
      {/* Just Agenda Section Only For gateway event */}
      {eventData?.event_uuid === "6acf01ed-3122-498a-a937-329766b459aa" && (
        <Section
          variant={"rounded"}
          className={"py-6"}
        >
          <GatewayAgenda />
        </Section>
      )}
      {/* Agenda Section END */}
      <Section
        variant="rounded"
        className={"py-6"}
      >
        <EventContent content={eventData.description} />
      </Section>
      {eventData.organizer && (
        <Section
          variant="rounded"
          className="py-6"
        >
          <OrganizerSection data={eventData.organizer} />
        </Section>
      )}
      {eventData?.sbt_collection_address && (
        <Section
          variant="topRounded"
          className="py-6"
        >
          <SBTCollectionSection
            collection_address={eventData.sbt_collection_address}
            rewardImage={eventData?.image_url}
            title={eventData.title}
          />
        </Section>
      )}
      {/* Telegram Main Button */}
      <EventTmaSettings
        requiresTicketToChekin={eventData.ticketToCheckIn}
        eventId={params.id}
        utm={page_utm}
      />
    </PageTma>
  );
};

export default Event;
export const dynamic = "force-dynamic";
