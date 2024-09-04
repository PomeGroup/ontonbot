"use client";

import AddVisitorWrapper from "@/app/_components/AddVisitorWrapper";
import { ClaimRewardButton } from "@/app/_components/ClaimRewardButton";
import EventNotStarted from "@/app/_components/EventNotStarted";
import AllTasks from "@/app/_components/Tasks";
import Buttons from "@/app/_components/atoms/buttons";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import Images from "@/app/_components/atoms/images";
import Labels from "@/app/_components/atoms/labels";
import Tasks from "@/app/_components/molecules/tasks";
import { trpc } from "@/app/_trpc/client";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import zod from "zod";
import EventPageLoadingSkeleton from "./loading";

export const EventDataPage = ({ eventHash }: { eventHash: string }) => {
  const webApp = useWebApp();
  const { role, authorized, user } = useAuth();
  const eventData = trpc.events.getEvent.useQuery(
    {
      event_uuid: eventHash,
      init_data: webApp?.initData || "",
    },
    {
      queryKey: [
        "events.getEvent",
        { event_uuid: eventHash, init_data: webApp?.initData || "" },
      ],
      enabled: Boolean(webApp?.initData),
    }
  );
  const router = useRouter();

  const { success, isNotEnded, isStarted, endUTC, startUTC, location } =
    useMemo(() => {
      if (!eventData.data) {
        return {
          success: false,
          endUTC: 0,
          startUTC: 0,
        };
      }
      const startUTC = Number(eventData.data.start_date) * 1000;
      const endUTC = Number(eventData.data.end_date) * 1000;

      const currentTime = Date.now();
      const isNotEnded = currentTime < endUTC;
      const isStarted = currentTime > startUTC;
      const location = eventData.data.location;
      const urlSchema = zod.string().url();
      const { success } = urlSchema.safeParse(location);
      return {
        isNotEnded,
        isStarted,
        success,
        endUTC,
        startUTC,
        location,
      };
    }, [
      eventData.data?.start_date,
      eventData.data?.end_date,
      eventData.data?.location,
    ]);

  return eventData.isLoading ? (
    <EventPageLoadingSkeleton />
  ) : eventData.isError || !eventData.isSuccess ? (
    <div>Something went wrong...</div>
  ) : eventData.data === null ? (
    <div>Event Not Found</div>
  ) : (
    <AddVisitorWrapper hash={eventHash}>
      <Images.Event url={eventData.data?.image_url!} />
      <Labels.CampaignTitle
        title={eventData.data?.title!}
        className="mt-6"
      />
      <Labels.CampaignDescription
        description={eventData.data?.subtitle!}
        className="text-secondary text-[14px] mb-2"
      />
      {location ? (
        success ? (
          <Labels.WebsiteLink location={location} />
        ) : (
          <Labels.CampaignDescription
            description={location}
            className="text-secondary text-[14px] mb-2"
          />
        )
      ) : null}
      <Labels.CampaignDescription description={eventData.data?.description!} />
      {isStarted && isNotEnded && eventData.data?.dynamic_fields ? (
        authorized &&
        (role !== "admin" || user?.user_id !== eventData.data.owner) && (
          <>
            <Tasks.Wallet />
            <AllTasks
              // @ts-expect-error
              tasks={eventData.data.dynamic_fields}
              eventHash={eventHash}
            />
            {!authorized && (
              <ClaimRewardButton
                eventId={eventData.data?.event_uuid as string}
              />
            )}
          </>
        )
      ) : // if it was not ended than it means the event is not started yet
      isNotEnded ? (
        <EventNotStarted
          title="Event is not started yet"
          end_date={endUTC}
          start_date={startUTC}
        />
      ) : (
        <EventNotStarted
          title="Event is ended already"
          end_date={endUTC}
          start_date={startUTC}
        />
      )}

      {authorized &&
        (role === "admin" || user?.user_id === eventData.data.owner) && (
          <MainButton
            text="Manage Event"
            onClick={() => {
              router.push(`/events/${eventHash}/edit`);
            }}
          />
        )}
      <Buttons.Support />
    </AddVisitorWrapper>
  );
};
