"use client";

import Alerts from "@/app/_components/molecules/alerts";
import { ManageEvent } from "@/app/_components/organisms/events";
import GuestList from "@/app/_components/organisms/events/GuestList";
import { trpc } from "@/app/_trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import { FC } from "react";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { FaRegEdit } from "react-icons/fa";

const CreateEventAdminPage: FC<{ params: { hash: string } }> = ({ params }) => {
  const WebApp = useWebApp();

  const event = trpc.events.getEvent.useQuery(
    { event_uuid: params.hash },
    {
      cacheTime: 0,
      queryKey: [
        "events.getEvent",
        { event_uuid: params.hash, },
      ],
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
          {
            event.data &&
            <GuestList
              event={event.data}
              params={params}
            />
          }
        </TabsContent>

        <TabsContent
          value="edit"
          className="pt-4"
        >
          <ManageEvent
            /* @ts-ignore  */
            event={event.data}
            eventHash={params.hash}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
