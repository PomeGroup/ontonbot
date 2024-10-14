"use client";

import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";
import Alerts from "@/app/_components/molecules/alerts";
import { ManageEvent } from "@/app/_components/organisms/events";
import GuestList from "@/app/_components/organisms/events/GuestList";
import { trpc } from "@/app/_trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAdminAuth from "@/hooks/useAdminAuth";
import useWebApp from "@/hooks/useWebApp";
import { FC } from "react";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { FaRegEdit } from "react-icons/fa";

const CreateEventAdminPage: FC<{ params: { UUID: string } }> = ({ params }) => {
  useWithBackButton({});
  const WebApp = useWebApp();

  const event = trpc.events.getEvent.useQuery(
    { event_uuid: params.UUID, init_data: WebApp?.initData || "" },
    {
      cacheTime: 0,
      enabled: Boolean(WebApp?.initData),
      queryKey: [
        "events.getEvent",
        { event_uuid: params.UUID, init_data: WebApp?.initData || "" },
      ],
    }
  );
  const hapticFeedback = WebApp?.HapticFeedback;

  const { authorized, isLoading } = useAdminAuth();

  if (isLoading || event.status === "loading") return null;
  if (authorized === false) return <Alerts.NotAuthorized />;
  if (event.error) return <div>{event.error.message}</div>;

  return (
    <main>
      <Tabs
        defaultValue="edit" // Set the default tab to "edit"
        className="mb-4"
      >
        <TabsList className="grid w-full py-0 grid-cols-2">
          <TabsTrigger onClick={() => hapticFeedback?.impactOccurred("medium")} value="edit">
            <FaRegEdit className="mr-2" /> Edit
          </TabsTrigger>
          <TabsTrigger onClick={() => hapticFeedback?.impactOccurred("medium")} value="manage">
            <BsFillPersonLinesFill className="mr-2" /> Guests List
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <GuestList event={event.data} params={params} />
        </TabsContent>
        <TabsContent value="edit" className="pt-4">
          <ManageEvent
            /* @ts-ignore */
            edit={true}
            event={event.data}
            eventUUID={params.UUID}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
