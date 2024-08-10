"use client";

import Buttons from "@/app/_components/atoms/buttons";
import CreateEventFields from "@/app/_components/CreateEventFields";
import Alerts from "@/app/_components/molecules/alerts";
import Tables from "@/app/_components/molecules/tables";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import { FC } from "react";

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

    requestExportFileMutation.mutate({
      event_uuid: params.hash,
      init_data: WebApp?.initData || "",
    });

    WebApp?.close();
  };

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
            Manage
          </TabsTrigger>
          <TabsTrigger
            onClick={() => hapticFeedback?.impactOccurred("medium")}
            value="edit"
          >
            ⚙️ Edit
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <div className="mt-2">
            <Button
              className="w-full relative"
              variant={"outline"}
              onClick={handleVisitorsExport}
            >
              Export Visitors as CSV to Clipboard
            </Button>
          </div>

          <Tables.Visitors event_uuid={params.hash} />

          <Buttons.WebAppBack whereTo={"/events"} />
        </TabsContent>

        <TabsContent value="edit">
          <CreateEventFields
            /* @ts-ignore  */
            event={event.data}
            event_uuid={params.hash}
          />

          <Buttons.WebAppBack whereTo={"/events"} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
