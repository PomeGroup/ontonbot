"use client";

import Alerts from "@/app/_components/molecules/alerts";
import GuestList from "@/app/_components/organisms/events/GuestList";
import ManageEvent from "@/app/_components/organisms/events/ManageEvent";
import { useGetEvent } from "@/hooks/events.hooks";
import useAuth from "@/hooks/useAuth";
import { Block, Page, Segmented, SegmentedButton } from "konsta/react";
import { useTheme } from "next-themes";
import { FC, useEffect, useState } from "react";

type ActiveTab = "guest_list" | "edit";

const CreateEventAdminPage: FC<{ params: { hash: string } }> = ({ params }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("guest_list");
  const { setTheme } = useTheme();

  const event = useGetEvent();

  const { authorized, isLoading } = useAuth();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

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
      {activeTab === "edit" && <ManageEvent event={event.data} />}
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
