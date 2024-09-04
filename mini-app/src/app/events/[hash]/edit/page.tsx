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
import React, {FC, useEffect, useState} from "react";
import Link from "next/link";
import { FaCloudDownloadAlt, FaRegEdit } from "react-icons/fa";
import CheckInGuest from "@/app/_components/checkInGuest/CheckInGuest";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { FaRegCopy } from "react-icons/fa";


const CreateEventAdminPage: FC<{ params: { hash: string } }> = ({ params }) => {
  const WebApp = useWebApp();
  const [needRefresh, setNeedRefresh] = useState(false);
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
  console.log("WebApp?.initDataUnsafe", WebApp?.initDataUnsafe);
  const handleVisitorsExport = () => {
    hapticFeedback?.impactOccurred("medium");
    requestExportFileMutation.mutate({
      event_uuid: params.hash,
      init_data: WebApp?.initData || "",
    });

    WebApp?.close();
  };
  const guestCheckInParams = { hash: params.hash , setNeedRefresh  , needRefresh };
  return (
    <div>
      <Tabs
        defaultValue="manage"
        className="mb-4"
      >
        <TabsList className="grid w-full py-0  grid-cols-2">
          <TabsTrigger
            onClick={() => hapticFeedback?.impactOccurred("medium")}
            value="manage"
          >
            <BsFillPersonLinesFill className="mr-2" />
            Guests List
          </TabsTrigger>
          <TabsTrigger
            onClick={() => hapticFeedback?.impactOccurred("medium")}
            value="edit"
          >
            <FaRegEdit className="mr-2" /> Edit
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <div className="mt-0 flex items-center space-x-2 px-2  ">
            <span className=" text-2xl font-extrabold tracking-tight text-gray-300 mr-auto" > Guests List </span>
            {event?.data && event.data.ticketToCheckIn === true && (
              <span >
                <CheckInGuest params={guestCheckInParams} />
              </span>
            )}

          </div>

          <Tables.Visitors
            event_uuid={params.hash}
            handleVisitorsExport={handleVisitorsExport}
            setNeedRefresh={setNeedRefresh}
            needRefresh={needRefresh}
          />

          <Buttons.WebAppBack whereTo={"/events"} />
        </TabsContent>

        <TabsContent value="edit" className="pt-4">
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
