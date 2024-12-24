"use client";

// import EventOrders from "@/app/_components/Event/Orders/Orders";
import Alerts from "@/app/_components/molecules/alerts";
import GuestList from "@/app/_components/organisms/events/GuestList";
import ManageEvent from "@/app/_components/organisms/events/ManageEvent";
import { useGetEvent, useGetEventOrders } from "@/hooks/events.hooks";
import useAuth from "@/hooks/useAuth";
import { Block, Page, Segmented, SegmentedButton } from "konsta/react";
import { LucideDot } from "lucide-react";
import { useTheme } from "next-themes";
import { FC, useEffect, useState } from "react";

type ActiveTab = "guest_list" | "edit" | "event_orders";

const CreateEventAdminPage: FC<{ params: { hash: string } }> = ({ params }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("guest_list");
  const { setTheme } = useTheme();

  const event = useGetEvent();
  // const eventOrders = useGetEventOrders();

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
          {/* <SegmentedButton */}
          {/*   strong */}
          {/*   active={activeTab === "event_orders"} */}
          {/*   onClick={() => setActiveTab("event_orders")} */}
          {/* > */}
          {/*   <div className="relative inline"> */}
          {/*     <span>Orders</span> */}
          {/*     {Number(eventOrders.data?.filter((o) => o?.state === "new").length) > 0 && ( */}
          {/*       <LucideDot className="text-red-500 animate-pulse -top-1/2 -right-4 absolute" /> */}
          {/*     )} */}
          {/*   </div> */}
          {/* </SegmentedButton> */}
          <SegmentedButton
            active={activeTab === "edit"}
            strong
            onClick={() => setActiveTab("edit")}
          >
            Edit
          </SegmentedButton>
        </Segmented>
      </Block>
      {activeTab === "edit" && <ManageEvent event={event.data} />}
      {/* {activeTab === "event_orders" && <EventOrders />} */}
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
