"use client";

import Alerts from "@/app/_components/molecules/alerts";
import { ManageEvent } from "@/app/_components/organisms/events";
import GuestList from "@/app/_components/organisms/events/GuestList";
import { trpc } from "@/app/_trpc/client";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import { Block, Page, Segmented, SegmentedButton } from "konsta/react";
import { FC, useState } from "react";

type ActiveTab = "guest_list" | "edit";

const CreateEventAdminPage: FC<{ params: { hash: string } }> = ({ params }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("guest_list");
  const WebApp = useWebApp();

  const event = trpc.events.getEvent.useQuery(
    { event_uuid: params.hash },
    {
      cacheTime: 0,
      queryKey: ["events.getEvent", { event_uuid: params.hash }],
    }
  );
  const hapticFeedback = WebApp?.HapticFeedback;

  const { authorized, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (authorized === false) {
    return <Alerts.NotAuthorized />;
  }

  if (event.error) {
    return <div>{event.error.message}</div>;
  }

  return (
    <Page>
      <Block>
        <Segmented strong>
          <SegmentedButton
            strong
            active={activeTab === "guest_list"}
            onClick={() => setActiveTab("guest_list")}
          >
            Guests List
          </SegmentedButton>
          <SegmentedButton
            strong
            active={activeTab === "edit"}
            onClick={() => setActiveTab("edit")}
          >
            Edit
          </SegmentedButton>
        </Segmented>
      </Block>
      {activeTab === "edit" && (
        <ManageEvent
          event={event.data}
          eventHash={params.hash}
        />
      )}
      {activeTab === "guest_list" && event.data && (
        <GuestList
          event={event.data}
          params={params}
        />
      )}
    </Page>
  );
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
