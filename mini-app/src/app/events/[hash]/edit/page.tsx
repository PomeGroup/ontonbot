"use client";

import Buttons from "@/app/_components/atoms/buttons";
import Alerts from "@/app/_components/molecules/alerts";
import Tables from "@/app/_components/molecules/tables";
import { ManageEvent } from "@/app/_components/organisms/events";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import { FC } from "react";
import Link from "next/link";
import { FaRegEdit } from "react-icons/fa";
import CheckInGuest from "@/app/_components/checkInGuest/CheckInGuest";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { FaRegCopy } from "react-icons/fa";
const CreateEventAdminPage: FC<{ params: { hash: string } }> = ({ params }) => {
  const WebApp = useWebApp();
  const event = trpc.events.getEvent.useQuery(
    { event_uuid: params.hash, init_data: WebApp?.initData || "" },
    {
      cacheTime: 0,
      enabled: Boolean(WebApp?.initData),
      queryKey: [
        "events.getEvent",
        { event_uuid: params.hash, init_data: WebApp?.initData || "" },
      ],
    }
  );
  const hapticFeedback = WebApp?.HapticFeedback;

  const { authorized, isLoading } = useAuth();

  const requestExportFileMutation = trpc.events.requestExportFile.useMutation();

  if (isLoading || event.status === "loading") {
    return null;
  }

  if (authorized === false) {
    return <Alerts.NotAuthorized />;
  }

  if (event.error) {
    return <div>{event.error.message}</div>;
  }

  const handleVisitorsExport = () => {
    hapticFeedback?.impactOccurred("medium");
    console.log("Exporting visitors as CSV");
    requestExportFileMutation.mutate({
      event_uuid: params.hash,
      init_data: WebApp?.initData || "",
    });

    WebApp?.close();
  };
  const guestCheckInParams = { hash: params.hash};
  return (
    <div>

      <Tabs
        defaultValue="manage"
        className="mb-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            onClick={() => hapticFeedback?.impactOccurred("medium")}
            value="manage"
          >
            <BsFillPersonLinesFill className="mr-2" />Guests List
          </TabsTrigger>
          <TabsTrigger
            onClick={() => hapticFeedback?.impactOccurred("medium")}
            value="edit"
          >
           <FaRegEdit className="mr-2" /> Edit
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <div className="mt-2">
            <Button
              className="w-full relative text-gray-100"
              variant={"outline"}
              onClick={handleVisitorsExport}
            >
              <FaRegCopy className="mr-2"  /> Export Visitors as CSV to Clipboard
            </Button>
            {event?.data && event.data.ticketToCheckIn === true && (
                <CheckInGuest params={guestCheckInParams} />
            )}

          </div>

          <Tables.Visitors event_uuid={params.hash} />

          <Buttons.WebAppBack whereTo={"/events"} />
        </TabsContent>

        <TabsContent value="edit">
          <ManageEvent
            /* @ts-ignore  */
            event={event.data}
            eventHash={params.hash}
          />

          <Buttons.WebAppBack whereTo={"/events"} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
